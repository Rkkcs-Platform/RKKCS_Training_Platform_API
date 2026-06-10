import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SubmissionStatus } from '../common/enums';
import {
  buildPaginationMeta,
  calculateAccuracy,
  calculateStreak,
  getTodayDate,
  isValidDateString,
  normalizeCode,
  parsePagination,
} from '../common/utils';
import { SubmissionHistoryQueryDto } from '../common/dto/pagination-query.dto';
import { ChallengesService } from '../challenges/challenges.service';
import { ChallengeDocument } from '../schemas/challenge.schema';
import {
  UserSubmission,
  UserSubmissionDocument,
} from '../schemas/user-submission.schema';
import { UserDocument } from '../schemas/user.schema';

@Injectable()
export class SubmissionsService {
  constructor(
    @InjectModel(UserSubmission.name)
    private readonly submissionModel: Model<UserSubmissionDocument>,
    private readonly challengesService: ChallengesService,
  ) {}

  async getTodayChallenge(user: UserDocument) {
    const challenge = await this.getTodayChallengeDocument();
    const submission = await this.getOrCreateSubmission(user._id, challenge);

    return this.toTodayProgress(challenge, submission);
  }

  async submitTodayCode(user: UserDocument, rawCode: string) {
    const challenge = await this.getTodayChallengeDocument();
    this.challengesService.assertChallengeActive(challenge);

    const submission = await this.getOrCreateSubmission(user._id, challenge);

    if (submission.status === SubmissionStatus.COMPLETED) {
      throw new BadRequestException('Challenge already completed for today');
    }

    if (submission.totalSubmitted >= challenge.totalCodes) {
      throw new BadRequestException('All codes have already been submitted');
    }

    const inputCode = normalizeCode(rawCode);
    const { isCorrect, matchedCode } = this.challengesService.matchCode(
      challenge,
      inputCode,
    );

    submission.answers.push({
      inputCode,
      matchedCode: isCorrect ? matchedCode : undefined,
      isCorrect,
      order: submission.totalSubmitted + 1,
      submittedAt: new Date(),
    });

    submission.totalSubmitted += 1;
    submission.totalCorrect += isCorrect ? 1 : 0;
    submission.totalWrong += isCorrect ? 0 : 1;
    submission.accuracy = calculateAccuracy(
      submission.totalCorrect,
      submission.totalSubmitted,
    );

    const completed = submission.totalSubmitted >= challenge.totalCodes;

    if (completed) {
      submission.status = SubmissionStatus.COMPLETED;
      submission.completedAt = new Date();
    }

    await submission.save();

    return {
      isCorrect,
      submitted: submission.totalSubmitted,
      correct: submission.totalCorrect,
      wrong: submission.totalWrong,
      completed,
    };
  }

  async getTodayResult(user: UserDocument) {
    const challenge = await this.getTodayChallengeDocument();
    const submission = await this.submissionModel
      .findOne({
        userId: user._id,
        date: challenge.date,
      })
      .exec();

    if (!submission) {
      throw new NotFoundException('No submission found for today');
    }

    return this.toResultResponse(challenge, submission);
  }

  async getHistory(user: UserDocument, query: SubmissionHistoryQueryDto) {
    const { page, limit, skip } = parsePagination(query.page, query.limit);
    const filter: Record<string, unknown> = { userId: user._id };

    if (query.status) {
      filter.status = query.status;
    }

    const [items, total] = await Promise.all([
      this.submissionModel
        .find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.submissionModel.countDocuments(filter).exec(),
    ]);

    return {
      items: items.map((item) => this.toHistoryItem(item)),
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async getSubmissionByDate(user: UserDocument, date: string) {
    if (!isValidDateString(date)) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }

    const submission = await this.submissionModel
      .findOne({ userId: user._id, date })
      .exec();

    if (!submission) {
      throw new NotFoundException(`No submission found for ${date}`);
    }

    const challenge = await this.challengesService.findByDate(date);

    return this.toResultResponse(challenge, submission);
  }

  async getStatistics(user: UserDocument) {
    const submissions = await this.submissionModel
      .find({ userId: user._id })
      .sort({ date: -1 })
      .exec();

    const completedSubmissions = submissions.filter(
      (item) => item.status === SubmissionStatus.COMPLETED,
    );

    const totalCorrect = submissions.reduce(
      (sum, item) => sum + item.totalCorrect,
      0,
    );
    const totalWrong = submissions.reduce(
      (sum, item) => sum + item.totalWrong,
      0,
    );
    const totalAttempts = totalCorrect + totalWrong;

    const completedDates = new Set(
      completedSubmissions.map((item) => item.date),
    );

    return {
      totalChallenges: submissions.length,
      completedChallenges: completedSubmissions.length,
      totalCorrect,
      totalWrong,
      accuracy: calculateAccuracy(totalCorrect, totalAttempts),
      streak: calculateStreak(completedDates, getTodayDate()),
    };
  }

  private async getTodayChallengeDocument(): Promise<ChallengeDocument> {
    const date = getTodayDate();
    return this.challengesService.ensureChallengeForDate(date);
  }

  private async getOrCreateSubmission(
    userId: Types.ObjectId,
    challenge: ChallengeDocument,
  ): Promise<UserSubmissionDocument> {
    const existing = await this.submissionModel
      .findOne({ userId, date: challenge.date })
      .exec();

    if (existing) {
      return existing;
    }

    return this.submissionModel.create({
      userId,
      challengeId: challenge._id,
      date: challenge.date,
      answers: [],
      totalSubmitted: 0,
      totalCorrect: 0,
      totalWrong: 0,
      accuracy: 0,
      startedAt: new Date(),
      status: SubmissionStatus.IN_PROGRESS,
    });
  }

  private toTodayProgress(
    challenge: ChallengeDocument,
    submission: UserSubmissionDocument,
  ) {
    return {
      date: challenge.date,
      totalCodes: challenge.totalCodes,
      submitted: submission.totalSubmitted,
      correct: submission.totalCorrect,
      wrong: submission.totalWrong,
      status: submission.status,
      startedAt: submission.startedAt,
    };
  }

  private toHistoryItem(submission: UserSubmissionDocument) {
    return {
      date: submission.date,
      correct: submission.totalCorrect,
      wrong: submission.totalWrong,
      accuracy: submission.accuracy,
      status: submission.status,
      completedAt: submission.completedAt,
    };
  }

  private toResultResponse(
    challenge: ChallengeDocument | null,
    submission: UserSubmissionDocument,
  ) {
    return {
      date: submission.date,
      totalCodes: challenge?.totalCodes ?? submission.totalSubmitted,
      submitted: submission.totalSubmitted,
      correct: submission.totalCorrect,
      wrong: submission.totalWrong,
      accuracy: submission.accuracy,
      status: submission.status,
      startedAt: submission.startedAt,
      completedAt: submission.completedAt,
      answers: submission.answers.map((answer) => ({
        order: answer.order,
        inputCode: answer.inputCode,
        isCorrect: answer.isCorrect,
        submittedAt: answer.submittedAt,
      })),
    };
  }
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import {
  ACTIVITY_ACTION,
} from '../common/constants/activity-action.constant';
import { ACTIVITY_TARGET } from '../common/constants/activity-target.constant';
import { SubmissionStatus } from '../common/enums';
import {
  buildPaginationMeta,
  calculateAccuracy,
  getTodayDate,
  isValidDateString,
  normalizeCode,
  parsePagination,
} from '../common/utils';
import { SubmissionHistoryQueryDto } from '../common/dto/pagination-query.dto';
import { AdminSubmissionListQueryDto } from './dto/admin-submission-list-query.dto';
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
    private readonly activityLogsService: ActivityLogsService,
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

    this.activityLogsService.recordFromUser(user, {
      action: ACTIVITY_ACTION.CODE_SUBMIT,
      targetType: ACTIVITY_TARGET.SUBMISSION,
      targetId: submission._id,
      metadata: {
        date: challenge.date,
        order: submission.totalSubmitted,
        inputCode,
        isCorrect,
      },
    });

    if (completed) {
      this.activityLogsService.recordFromUser(user, {
        action: ACTIVITY_ACTION.BATCH_COMPLETED,
        targetType: ACTIVITY_TARGET.SUBMISSION,
        targetId: submission._id,
        metadata: {
          date: challenge.date,
          submitted: submission.totalSubmitted,
          correct: submission.totalCorrect,
          wrong: submission.totalWrong,
          accuracy: submission.accuracy,
        },
      });
    }

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

  async getAdminSubmissions(query: AdminSubmissionListQueryDto) {
    if (query.date && !isValidDateString(query.date)) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }

    const { page, limit, skip } = parsePagination(query.page, query.limit);
    const filter: Record<string, unknown> = {};

    if (query.date) {
      filter.date = query.date;
    }

    if (query.status) {
      filter.status = query.status;
    }

    const [items, total] = await Promise.all([
      this.submissionModel
        .find(filter)
        .populate('userId', 'name email staffCode')
        .sort({ date: -1, updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.submissionModel.countDocuments(filter).exec(),
    ]);

    return {
      items: items.map((item) => this.toAdminListItem(item)),
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async getAdminSubmissionById(submissionId: string) {
    if (!Types.ObjectId.isValid(submissionId)) {
      throw new BadRequestException('Invalid submission ID');
    }

    const submission = await this.submissionModel
      .findById(submissionId)
      .populate('userId', 'name email staffCode')
      .exec();

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    return this.toAdminDetail(submission);
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

    return {
      totalChallenges: submissions.length,
      completedChallenges: completedSubmissions.length,
      totalCorrect,
      totalWrong,
      accuracy: calculateAccuracy(totalCorrect, totalAttempts),
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

  private toAdminListItem(submission: UserSubmissionDocument) {
    const user = submission.userId as unknown as UserDocument;

    return {
      id: submission._id.toString(),
      date: submission.date,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        staffCode: user.staffCode,
      },
      submitted: submission.totalSubmitted,
      correct: submission.totalCorrect,
      wrong: submission.totalWrong,
      accuracy: submission.accuracy,
      status: submission.status,
      startedAt: submission.startedAt,
      completedAt: submission.completedAt,
    };
  }

  private toAdminDetail(submission: UserSubmissionDocument) {
    const user = submission.userId as unknown as UserDocument;

    return {
      id: submission._id.toString(),
      date: submission.date,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        staffCode: user.staffCode,
      },
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

import { Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import {
  buildChallengeCodesCsv,
  toCsvBuffer,
} from '../common/utils';
import { ChallengeCode } from '../schemas/challenge.schema';
import { ChallengesService } from './challenges.service';

@Injectable()
export class ChallengeExportService {
  constructor(private readonly challengesService: ChallengesService) {}

  async exportByDate(date: string, shopId?: string): Promise<StreamableFile> {
    const challenge = await this.challengesService.findByDate(date, shopId);

    if (!challenge) {
      throw new NotFoundException(`No batch found for date ${date}`);
    }

    return this.toStreamableFile(challenge.date, challenge.codes);
  }

  async exportByChallengeId(challengeId: string): Promise<StreamableFile> {
    const challenge = await this.challengesService.findById(challengeId);
    return this.toStreamableFile(challenge.date, challenge.codes);
  }

  private toStreamableFile(
    date: string,
    codes: ChallengeCode[],
  ): StreamableFile {
    const { filename, content } = buildChallengeCodesCsv(date, codes);

    return new StreamableFile(toCsvBuffer(content), {
      type: 'text/csv; charset=utf-8',
      disposition: `attachment; filename="${filename}"`,
    });
  }
}

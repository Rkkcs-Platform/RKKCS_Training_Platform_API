import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ChallengeStatus, GeneratedBy } from '../common/enums';

export type ChallengeDocument = HydratedDocument<Challenge>;

@Schema({ _id: false })
export class ChallengeCode {
  @Prop({ required: true, trim: true, uppercase: true })
  code: string;

  @Prop({ required: true, min: 1 })
  order: number;
}

export const ChallengeCodeSchema = SchemaFactory.createForClass(ChallengeCode);

@Schema({ timestamps: true, collection: 'challenges' })
export class Challenge {
  @Prop({ type: Types.ObjectId, ref: 'Shop', required: true })
  shopId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  date: string;

  @Prop({ type: [ChallengeCodeSchema], default: [] })
  codes: ChallengeCode[];

  @Prop({ required: true, min: 0 })
  totalCodes: number;

  @Prop({ required: true, min: 1 })
  codeLength: number;

  @Prop({ required: true })
  generatedAt: Date;

  @Prop({ required: true, enum: GeneratedBy, default: GeneratedBy.SYSTEM })
  generatedBy: GeneratedBy;

  @Prop({ required: true, enum: ChallengeStatus, default: ChallengeStatus.ACTIVE })
  status: ChallengeStatus;
}

export const ChallengeSchema = SchemaFactory.createForClass(Challenge);

ChallengeSchema.index({ shopId: 1, date: 1 }, { unique: true });
ChallengeSchema.index({ date: 1 });
ChallengeSchema.index({ status: 1 });

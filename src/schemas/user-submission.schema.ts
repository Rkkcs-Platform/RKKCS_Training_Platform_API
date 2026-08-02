import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { SubmissionStatus } from '../common/enums';

export type UserSubmissionDocument = HydratedDocument<UserSubmission>;

@Schema({ _id: false })
export class SubmissionAnswer {
  @Prop({ required: true, trim: true, uppercase: true })
  inputCode: string;

  @Prop({ trim: true, uppercase: true })
  matchedCode?: string;

  @Prop({ required: true })
  isCorrect: boolean;

  @Prop({ required: true, min: 1 })
  order: number;

  @Prop({ required: true, default: () => new Date() })
  submittedAt: Date;
}

export const SubmissionAnswerSchema =
  SchemaFactory.createForClass(SubmissionAnswer);

@Schema({ timestamps: true, collection: 'user_submissions' })
export class UserSubmission {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Shop', required: true })
  shopId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Challenge', required: true })
  challengeId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  date: string;

  @Prop({ type: [SubmissionAnswerSchema], default: [] })
  answers: SubmissionAnswer[];

  @Prop({ required: true, default: 0, min: 0 })
  totalSubmitted: number;

  @Prop({ required: true, default: 0, min: 0 })
  totalCorrect: number;

  @Prop({ required: true, default: 0, min: 0 })
  totalWrong: number;

  @Prop({ required: true, default: 0, min: 0 })
  accuracy: number;

  @Prop({ required: true, default: () => new Date() })
  startedAt: Date;

  @Prop()
  completedAt?: Date;

  @Prop({
    required: true,
    enum: SubmissionStatus,
    default: SubmissionStatus.IN_PROGRESS,
  })
  status: SubmissionStatus;
}

export const UserSubmissionSchema =
  SchemaFactory.createForClass(UserSubmission);

UserSubmissionSchema.index({ userId: 1, date: 1 }, { unique: true });
UserSubmissionSchema.index({ challengeId: 1 });
UserSubmissionSchema.index({ shopId: 1 });
UserSubmissionSchema.index({ status: 1 });
UserSubmissionSchema.index({ date: 1 });

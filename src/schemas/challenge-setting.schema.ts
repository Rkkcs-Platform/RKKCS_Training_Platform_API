import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ChallengeSettingDocument = HydratedDocument<ChallengeSetting>;

@Schema({ timestamps: true, collection: 'challenge_settings' })
export class ChallengeSetting {
  @Prop({ trim: true })
  date?: string;

  @Prop({ required: true, min: 1 })
  codeCount: number;

  @Prop({ required: true, min: 1 })
  codeLength: number;

  @Prop({ required: true, trim: true })
  generateTime: string;

  @Prop({ required: true, default: false})
  isAutoRandomCodeCount: boolean;

  @Prop({ required: true, default: false })
  isDefault: boolean;

  @Prop({ default: false })
  maintenanceMode: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;
}

export const ChallengeSettingSchema =
  SchemaFactory.createForClass(ChallengeSetting);

ChallengeSettingSchema.index({ date: 1 });
ChallengeSettingSchema.index({ isDefault: 1 });
ChallengeSettingSchema.index({ isAutoRandomCodeCount: 1 });

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ProcessingJobStatus } from '../common/enums';

export type ProcessingJobDocument = HydratedDocument<ProcessingJob>;

@Schema({ timestamps: true, collection: 'processing_jobs' })
export class ProcessingJob {
  @Prop({ type: Types.ObjectId, ref: 'Challenge', required: true })
  batchId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Shop', required: true })
  shopId: Types.ObjectId;

  @Prop({
    required: true,
    enum: ProcessingJobStatus,
    default: ProcessingJobStatus.PENDING,
  })
  status: ProcessingJobStatus;

  @Prop({ required: true, default: 0, min: 0 })
  generatedOrders: number;

  @Prop()
  error?: string;

  @Prop()
  completedAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ProcessingJobSchema = SchemaFactory.createForClass(ProcessingJob);

ProcessingJobSchema.index({ batchId: 1 });
ProcessingJobSchema.index({ shopId: 1, createdAt: -1 });
ProcessingJobSchema.index({ status: 1 });

import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import {
  ActivityLog,
  ActivityLogSchema,
  Challenge,
  ChallengeSchema,
  ChallengeSetting,
  ChallengeSettingSchema,
  User,
  UserSchema,
  UserSubmission,
  UserSubmissionSchema,
} from '../schemas';
import { DatabaseLoggerService } from './database-logger.service';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('Database');

        return {
          uri: configService.getOrThrow<string>('MONGODB_URI'),
          connectionFactory: (connection: Connection) => {
            connection.on('error', (error: Error) => {
              logger.error(`MongoDB connection failed: ${error.message}`);
            });
            return connection;
          },
        };
      },
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: ChallengeSetting.name, schema: ChallengeSettingSchema },
      { name: Challenge.name, schema: ChallengeSchema },
      { name: UserSubmission.name, schema: UserSubmissionSchema },
      { name: ActivityLog.name, schema: ActivityLogSchema },
    ]),
  ],
  providers: [DatabaseLoggerService],
  exports: [MongooseModule],
})
export class DatabaseModule {}

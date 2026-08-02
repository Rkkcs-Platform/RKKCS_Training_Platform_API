import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { ActivityLogsModule } from './activity-logs/activity-logs.module';
import { AuthModule } from './auth/auth.module';
import { ChallengesModule } from './challenges/challenges.module';
import { CommonModule } from './common/common.module';
import { validateEnv } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health/health.controller';
import { PingController } from './health/ping.controller';
import { OrdersModule } from './orders/orders.module';
import { ProcessingJobsModule } from './processing/processing.module';
import { ReportsModule } from './reports/reports.module';
import { CategoriesModule } from './categories/categories.module';
import { NewsModule } from './news/news.module';
import { SeedModule } from './seed/seed.module';
import { SettingsModule } from './settings/settings.module';
import { ShopsModule } from './shops/shops.module';
import { SubmissionsModule } from './submissions/submissions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100,
      },
    ]),
    ScheduleModule.forRoot(),
    CommonModule,
    DatabaseModule,
    ActivityLogsModule,
    AuthModule,
    SettingsModule,
    ShopsModule,
    ChallengesModule,
    ProcessingJobsModule,
    SubmissionsModule,
    OrdersModule,
    CategoriesModule,
    NewsModule,
    ReportsModule,
    SeedModule,
  ],
  controllers: [HealthController, PingController],
})
export class AppModule {}



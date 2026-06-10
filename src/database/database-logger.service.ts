import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class DatabaseLoggerService implements OnModuleInit {
  private readonly logger = new Logger('Database');

  constructor(
    @InjectConnection() private readonly connection: Connection,
  ) {}

  onModuleInit() {
    this.connection.on('connected', () => this.logSuccess());
    this.connection.on('error', (error: Error) => {
      this.logger.error(`MongoDB connection failed: ${error.message}`);
    });
    this.connection.on('disconnected', () => {
      this.logger.warn('MongoDB disconnected');
    });
    this.connection.on('reconnected', () => {
      this.logger.log('MongoDB reconnected successfully');
    });

    if (this.connection.readyState === 1) {
      this.logSuccess();
    }
  }

  private logSuccess() {
    const dbName = this.connection.name || 'unknown';
    const host = this.connection.host || 'unknown';
    this.logger.log(`MongoDB connected successfully → ${dbName} @ ${host}`);
  }
}

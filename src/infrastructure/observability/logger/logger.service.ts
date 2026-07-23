import { logger } from './setup';
import { ILoggerService } from '@/application/adaptors/logger.service';
import { LoggerService as Logger } from '@edulearn/core';

export class LoggerService extends Logger implements ILoggerService {
  public static instance: LoggerService;

  private constructor() {
    super(logger);
  }

  public static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }
}

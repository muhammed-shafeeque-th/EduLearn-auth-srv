import { BaseError } from './base-error';
import { ErrorCodes } from './error-codes/error-codes';
import { StatusCodes } from './error-codes/error-status-codes';

export class AuthenticationError extends BaseError {
  errorCode: ErrorCodes = ErrorCodes.AUTHENTICATION_ERROR;
  public statusCode: StatusCodes = StatusCodes.AUTHENTICATION_ERROR;
  constructor(message?: string) {
    super(message || 'Authentication failed!. please check your token ');
  }

  serializeErrors(): { message: string; field?: string }[] {
    return [
      {
        message: this.message || 'Authentication failed',
      },
    ];
  }
}

import { BaseError } from './base-error';
import { ErrorCodes } from './error-codes/error-codes';
import { StatusCodes } from './error-codes/error-status-codes';

export class ForbiddenError extends BaseError {
  errorCode: ErrorCodes = ErrorCodes.FORBIDDEN_ERROR;
  public statusCode: StatusCodes = StatusCodes.FORBIDDEN;
  constructor(message?: string) {
    super(message || 'Forbidden: You do not have permission to access this resource.');
  }

  serializeErrors(): { message: string; field?: string }[] {
    return [
      {
        message: this.message || 'Authentication failed',
      },
    ];
  }
}

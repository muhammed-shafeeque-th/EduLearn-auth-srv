import { BaseError } from './base-error';
import { StatusCodes } from './error-codes/error-status-codes';

export default class InvalidTokenError extends BaseError {
  errorCode = 'InvalidTokenError';
  public statusCode: StatusCodes = StatusCodes.BAD_REQUEST;
  constructor(message?: string) {
    super(message || 'invalid token provided !. please check token');
  }

  serializeErrors(): { message: string; field?: string }[] {
    return [
      {
        message: this.message || 'invalid token',
      },
    ];
  }
}

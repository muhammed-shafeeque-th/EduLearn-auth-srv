import { BaseError } from './base-error';
import { ErrorCodes } from './error-codes/error-codes';
import { StatusCodes } from './error-codes/error-status-codes';

export default class BadRequestError extends BaseError {
  errorCode: ErrorCodes = ErrorCodes.BAD_REQUEST;
  public statusCode: StatusCodes = StatusCodes.BAD_REQUEST;
  constructor(message?: string) {
    super(message || 'invalid parameters!. please check request parameters ');
  }

  serializeErrors(): { message: string; field?: string }[] {
    return [
      {
        message: this.message || 'invalid request parameters',
      },
    ];
  }
}

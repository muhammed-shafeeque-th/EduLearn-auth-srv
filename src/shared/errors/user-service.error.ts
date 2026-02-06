import { BaseError } from './base-error';
import { ErrorCodes } from './error-codes/error-codes';
import { StatusCodes } from './error-codes/error-status-codes';

export abstract class UserServiceError extends BaseError {
  abstract errorCode: ErrorCodes;
  abstract statusCode: StatusCodes;

  constructor(message?: string) {
    super(message);

    Object.setPrototypeOf(this, new.target.prototype);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

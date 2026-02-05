import { BaseError } from './base-error';
import { ErrorCodes } from './error-codes/error-codes';
import { StatusCodes } from './error-codes/error-status-codes';

export default class NotFoundError extends BaseError {
  errorCode: ErrorCodes = ErrorCodes.NOT_FOUND_ERROR;
  public statusCode: StatusCodes = StatusCodes.NOT_FOUND;

  constructor(message?: string) {
    super(message || 'Required resource not found.');
  }

  serializeErrors(): { message: string; field?: string }[] {
    return [{ message: this.message || 'Invalid userId., user not found with specified id!.' }];
  }
}

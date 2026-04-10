import { BaseError } from './base-error';
import { ErrorCode } from './error-codes/error-codes';

export default class NotFoundError extends BaseError {
  constructor(message?: string) {
    super(ErrorCode.NOT_FOUND, message || 'Required resource not found.', 'RESOURCE_NOT_FOUND');
  }

  serializeErrors(): { message: string; field?: string }[] {
    return [{ message: this.message || 'Invalid userId., user not found with specified id!.' }];
  }
}

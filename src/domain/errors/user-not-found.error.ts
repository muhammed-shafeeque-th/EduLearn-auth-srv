import { ErrorCode } from '@/shared/errors/error-codes/error-codes';
import { DomainError } from './domain.exceptions';

export default class UserNotFoundError extends DomainError {
  constructor(message?: string) {
    super(ErrorCode.NOT_FOUND, message || 'Invalid userId.', 'USER_NOT_FOUND');
  }

  serializeErrors(): { message: string; field?: string }[] {
    return [{ message: this.message || 'Invalid userId., user not found with specified id!.' }];
  }
}

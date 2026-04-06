import { ErrorCode } from '../../shared/errors/error-codes/error-codes';
import { DomainError } from './domain.exceptions';

export abstract class UserServiceError extends DomainError {
  constructor(message?: string) {
    super(
      ErrorCode.BUSINESS_RULE_VIOLATION,
      message ?? 'User domain exception occurred',
      'USER_DOMAIN_EXCEPTION',
    );

    Object.setPrototypeOf(this, new.target.prototype);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

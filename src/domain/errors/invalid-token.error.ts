import { ErrorCode } from '@/shared/errors/error-codes/error-codes';
import { DomainError } from './domain.exceptions';

export default class InvalidTokenError extends DomainError {
  constructor(message?: string) {
    super(
      ErrorCode.INVALID_ARGUMENT,
      message || 'invalid token provided !. please check token',
      'INVALID_AUTH_TOKEN',
    );
  }

  serializeErrors(): { message: string; field?: string }[] {
    return [
      {
        message: this.message || 'invalid token',
      },
    ];
  }
}

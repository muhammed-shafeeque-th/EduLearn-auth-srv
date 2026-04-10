import { BaseError } from './base-error';
import { ErrorCode } from './error-codes/error-codes';

export class AuthenticationError extends BaseError {
  constructor(message?: string) {
    super(
      ErrorCode.UNAUTHENTICATED,
      message || 'Authentication failed!. please check your token',
      'AUTHENTICATION_FAILED',
    );
  }

  serializeErrors(): { message: string; field?: string }[] {
    return [
      {
        message: this.message || 'Authentication failed',
      },
    ];
  }
}

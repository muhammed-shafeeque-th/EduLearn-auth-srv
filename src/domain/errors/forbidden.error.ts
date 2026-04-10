import { ErrorCode } from '@/shared/errors/error-codes/error-codes';
import { DomainError } from './domain.exceptions';

export class ForbiddenError extends DomainError {
  constructor(message?: string) {
    super(
      ErrorCode.PERMISSION_DENIED,
      message || 'Forbidden: You do not have permission to access this resource.',
      'RESOURCE_ACCESS_DENIED',
    );
  }

  serializeErrors(): { message: string; field?: string }[] {
    return [
      {
        message: this.message || 'Authorization required',
      },
    ];
  }
}

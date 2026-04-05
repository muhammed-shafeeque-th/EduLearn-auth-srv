import { BaseError } from '@/shared/errors';
import { ErrorCode } from '@/shared/errors/error-codes/error-codes';

export abstract class DomainError extends BaseError {
  constructor(code: ErrorCode, message: string, reason?: string, metadata?: Record<string, any>) {
    super(code, message, reason, metadata);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
  }
}

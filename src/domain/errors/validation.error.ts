import { ValidationError as InvalidError } from 'class-validator';
import { ErrorCode } from '../../shared/errors/error-codes/error-codes';
import { DomainError } from './domain.exceptions';

export class ValidationError extends DomainError {
  public constructor(private errors: InvalidError[]) {
    super(ErrorCode.INVALID_ARGUMENT, 'Invalid request parameters', 'REQUEST_VALIDATION_ERROR');
  }

  public serializeErrors(): { message: string; field?: string }[] {
    return this.errors.map((err) => {
      return {
        message: (err.constraints && Object.values(err.constraints)[0]) || 'invalid',
        field: String(err.property),
      };
    });

    // return [{ message: this.message }];
  }
}

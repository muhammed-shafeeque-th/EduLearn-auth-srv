import { ValidationError as InvalidError } from 'class-validator';
import { BaseError } from './base-error';
import { ErrorCodes } from './error-codes/error-codes';
import { StatusCodes } from './error-codes/error-status-codes';

export class ValidationError extends BaseError {
  public errorCode: ErrorCodes.INVALID_ARGUMENT = ErrorCodes.INVALID_ARGUMENT;
  public statusCode: StatusCodes.INVALID_ARGUMENT = StatusCodes.INVALID_ARGUMENT;

  public constructor(private errors: InvalidError[]) {
    super('Invalid request parameters ');
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

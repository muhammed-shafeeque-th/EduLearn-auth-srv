import { BaseError } from './base-error';
import { ErrorCode } from './error-codes/error-codes';

export default class BadRequestError extends BaseError {
  constructor(message?: string) {
    super(
      ErrorCode.INVALID_ARGUMENT,
      message || 'invalid parameters!. please check request parameters ',
      'INVALID_REQUEST_PARAMETERS',
    );
  }

  serializeErrors(): { message: string; field?: string }[] {
    return [
      {
        message: this.message || 'invalid request parameters',
      },
    ];
  }
}

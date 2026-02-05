import { ErrorCodes } from './error-codes/error-codes';
import { StatusCodes } from './error-codes/error-status-codes';
import { BaseError } from './base-error';

export default class EmailAlreadyExist extends BaseError {
  errorCode: ErrorCodes.EMAIL_ALREADY_REGISTERED = ErrorCodes.EMAIL_ALREADY_REGISTERED;
  public statusCode: StatusCodes = StatusCodes.EMAIL_ALREADY_REGISTERED;
  constructor(message?: string) {
    super(message || 'user already exist with given email');
  }

  serializeErrors(): { message: string; field?: string }[] {
    return [
      {
        message:
          this.message || 'user already exist with given email, please check email and try again.',

        field: 'email',
      },
    ];
  }
}

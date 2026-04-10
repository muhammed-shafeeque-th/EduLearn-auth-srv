import { ErrorCode } from '../../shared/errors/error-codes/error-codes';
import { DomainError } from './domain.exceptions';

export default class EmailAlreadyExist extends DomainError {
  constructor(message?: string) {
    super(
      ErrorCode.ALREADY_EXISTS,
      message || 'user already exist with given email',
      'USER_ALREADY_EXIST',
    );
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

import { BaseError } from './base-error';
import { ErrorCode } from './error-codes/error-codes';

export class EnvNotFoundError extends BaseError {
  private env: string;

  constructor(env: string) {
    super(ErrorCode.INTERNAL, "can't load env " + env, 'ENV_NOT_FOUND');
    this.env = env;
  }
  serializeErrors(): { message: string; field?: string }[] {
    return [{ message: 'Error while loading env' }];
  }
  getResolutionSteps(): string[] {
    return [
      'check whether your .env file has been set. ',
      'if defined, set up ' + this.env + ' in the file \n',
    ];
  }
}

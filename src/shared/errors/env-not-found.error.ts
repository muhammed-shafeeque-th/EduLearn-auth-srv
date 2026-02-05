import { BaseError } from './base-error';
import { ErrorCodes } from './error-codes/error-codes';
import { StatusCodes } from './error-codes/error-status-codes';

export class EnvNotFoundError extends BaseError {
  public errorCode: ErrorCodes.ENV_LOAD_ERROR;
  public statusCode: StatusCodes.INTERNAL_ERROR;
  private env: string;

  constructor(env: string) {
    super("can't load env " + env);
    this.env = env;

    this.statusCode = StatusCodes.INTERNAL_ERROR;
    this.errorCode = ErrorCodes.ENV_LOAD_ERROR;
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

import { ErrorCode } from './error-codes/error-codes';

export abstract class BaseError extends Error {
  constructor(
    public readonly errorCode: ErrorCode,
    public readonly message: string,
    public readonly reason?: string,
    public readonly metadata?: Record<string, any>,
  ) {
    super(message);

    Object.setPrototypeOf(this, new.target.prototype);
    // Object.setPrototypeOf(this, BaseError.prototype);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  // public toGrpcError(): Partial<ServiceError> {
  //   const metadata = new Metadata();
  //   // const details = this.serializeErrors && JSON.stringify(this.serializeErrors());
  //   const details = this.message;
  //   metadata.set('detail', details);
  //   metadata.set('error_code', this.errorCode);
  //   return {
  //     code: this.mapErrorToStatus(this.statusCode),
  //     message: this.message,
  //     name: this.constructor.name,
  //     details: details,
  //     metadata: metadata,
  //   };
  // }

  abstract serializeErrors(): { message: string; field?: string }[];

  logError(): void {
    console.error({
      errorCode: this.errorCode,
      message: this.message,
      stack: this.stack,
    });
  }

  toJSON() {
    return {
      errorCode: this.errorCode,
      message: this.message,
    };
  }
  toString() {
    return {
      errorCode: this.errorCode,
      message: this.message,
    };
  }
}

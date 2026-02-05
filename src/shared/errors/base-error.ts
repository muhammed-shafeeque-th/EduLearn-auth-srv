export abstract class BaseError extends Error {
  abstract statusCode: number;
  abstract errorCode: any;

  constructor(message?: string) {
    super(message);

    Object.setPrototypeOf(this, Error.prototype);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
  abstract serializeErrors(): { message: string; field?: string }[];

  // optional resolution steps for debugging
  getResolutionSteps(): string[] {
    return [];
  }

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

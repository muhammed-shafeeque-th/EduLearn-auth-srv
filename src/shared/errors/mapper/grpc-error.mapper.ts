import { status, Metadata, ServiceError } from '@grpc/grpc-js';
import { BaseError } from '../base-error';
import { ErrorCode } from '../error-codes/error-codes';

export class GrpcErrorMapper {
  static toGrpc(error: unknown): ServiceError {
    const metadata = new Metadata();
    let errorCode: string;
    let errorName: string;
    let reason: string;
    let message: string;
    let code: status;
    if (error instanceof BaseError) {
      errorCode = error.errorCode;
      reason = error.reason!;
      errorName = error.name;
      message = error.message;
      code = this.mapCodeToGrpcStatus(error.errorCode);
    }

    metadata.set('error_code', (errorCode ??= 'INTERNAL_ERROR'));
    metadata.set('reason', (reason ??= 'SOMETHING_WENT_WRONG'));
    metadata.set('detail', (message ??= 'Something went wrong'));

    return {
      name: (errorName ??= 'InternalError'),
      message: (message ??= 'Internal server error'),
      code: (code ??= status.INTERNAL),
      details: message ?? 'Unknown error',
      metadata,
    };
  }

  private static mapCodeToGrpcStatus(errorCode: ErrorCode): status {
    switch (errorCode) {
      case ErrorCode.NOT_FOUND:
        return status.NOT_FOUND;
      case ErrorCode.ALREADY_EXISTS:
        return status.ALREADY_EXISTS;
      case ErrorCode.INVALID_ARGUMENT:
        return status.INVALID_ARGUMENT;
      case ErrorCode.UNAUTHENTICATED:
        return status.UNAUTHENTICATED;
      case ErrorCode.PERMISSION_DENIED:
        return status.PERMISSION_DENIED;
      case ErrorCode.CONFLICT:
        return status.ABORTED;
      case ErrorCode.CANCELLED:
        return status.CANCELLED;
      case ErrorCode.OUT_OF_RANGE:
        return status.OUT_OF_RANGE;
      case ErrorCode.BUSINESS_RULE_VIOLATION:
        return status.INVALID_ARGUMENT;
      default:
        return status.INTERNAL;
    }
  }
}

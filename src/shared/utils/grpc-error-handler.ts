import { Metadata, sendUnaryData, ServerWritableStream, ServiceError, status } from '@grpc/grpc-js';
import { BaseError } from '../errors/base-error';

const mapHttpStatusToGrpcStatus = (httpStatus: number): number => {
  const statusMap: { [key: number]: number } = {
    200: 0, // OK
    400: 3, // INVALID_ARGUMENT
    401: 16, // UNAUTHENTICATED
    403: 7, // PERMISSION_DENIED
    404: 5, // NOT_FOUND
    409: 6, // ALREADY_EXISTS or ABORTED
    412: 9, // FAILED_PRECONDITION
    429: 8, // RESOURCE_EXHAUSTED
    500: 13, // INTERNAL
    503: 14, // UNAVAILABLE
    504: 4, // DEADLINE_EXCEEDED
  };
  return statusMap[httpStatus] || 2; // UNKNOWN
};

export default function grpcErrorHandler(
  error: Error,
  callback: sendUnaryData<any> | ServerWritableStream<any, any>,
): void {
  let serviceError: ServiceError;

  if (error instanceof BaseError) {
    error.logError();
    const metadata = new Metadata();
    metadata.set('error_type', error.constructor.name);
    metadata.set('error_code', String(error.errorCode));
    metadata.set('error_stack', JSON.stringify(error.stack || ''));

    const serializeErrors = error.serializeErrors();
    if (serializeErrors && serializeErrors.length > 0) {
      metadata.set('error_details', JSON.stringify(serializeErrors));
    }

    // create the gRPC error object directly
    serviceError = {
      code: mapHttpStatusToGrpcStatus(error.statusCode),
      message: error.errorCode,
      details: error.message,
      name: error.constructor.name,
      metadata,
      stack: error.stack,
    } as ServiceError;
  } else {
    serviceError = {
      code: status.UNKNOWN,
      message: 'UNKNOWN_ERROR',
      details: error.message,
      name: error.constructor.name,
      stack: error.stack,
    } as ServiceError;
  }

  if ('write' in callback) {
    callback.emit('error', serviceError);
    callback.end();
  } else {
    callback(serviceError, null);
  }
}

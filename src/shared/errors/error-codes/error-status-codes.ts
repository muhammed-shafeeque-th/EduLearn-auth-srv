export enum StatusCodes {
  UNKNOWN_ERROR = 500, // Internal Server Error
  INVALID_ARGUMENT = 400, // Bad Request
  VALIDATION_ERROR = 400,
  AUTHENTICATION_ERROR = 401,
  AUTHORIZATION_ERROR = 403, // Unauthorized
  FORBIDDEN = 403, // Forbidden
  PERMISSION_DENIED = 403, // Forbidden
  NOT_FOUND = 404, // Not Found
  ALREADY_EXISTS = 409, // Conflict
  DEADLINE_EXCEEDED = 504, // Gateway Timeout
  INTERNAL_ERROR = 500, // Internal Server Error
  UNAVAILABLE = 503, // Service Unavailable
  DATA_INTEGRITY_VIOLATION = 500, // Internal Server Error
  BAD_REQUEST = 400, // Bad Request
  UNAUTHORIZED = 401, // Unauthorized
  CONFLICT = 409, // Conflict
  USERNAME_ALREADY_TAKEN = 409, // Conflict
  EMAIL_ALREADY_REGISTERED = 409, // Conflict
  INCORRECT_PASSWORD = 401, // Unauthorized
  INVALID_REFRESH_TOKEN = 401, // Unauthorized
  USER_BLOCKED = 403, // Forbidden
  WALLET_OPERATION_FAILED = 500, // Internal Server Error
  INSTRUCTOR_ROLE_REQUIRED = 403, // Forbidden
}

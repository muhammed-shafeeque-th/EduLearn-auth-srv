/**
 * Represents the context information for logging operations.
 * This interface provides metadata that can be attached to log entries
 * to enable distributed tracing and correlation across microservices.
 *
 * @interface LogContext
 *
 * @property {string} [traceId] - Unique identifier for the entire trace across all services
 * @property {string} [spanId] - Unique identifier for a specific operation within a trace
 * @property {string} [userId] - Identifier of the user associated with the log entry
 * @property {string} [correlationId] - Correlation identifier for grouping related operations
 * @property {string} [service] - Name of the service generating the log entry
 * @property {string} [environment] - Environment where the service is running (e.g., 'development', 'production')
 * @property {string} [ctx] - Additional context string for custom logging information
 * @property {Record<string, unknown>} [key: string] - Extensible property for custom context data
 *
 * @example
 * const context: LogContext = {
 *   traceId: '550e8400-e29b-41d4-a716-446655440000',
 *   userId: 'user123',
 *   service: 'auth-service',
 *   environment: 'production'
 * };
 */
export interface LogContext {
  /**
   * Logs an informational message with optional context.
   * @param {string} message - The message to log
   * @param {LogContext} [context] - Optional context information for the log entry
   */
  traceId?: string;
  spanId?: string;
  userId?: string;
  correlationId?: string;
  service?: string;
  environment?: string;
  ctx?: string;

  [key: string]: unknown;
}
export interface ILoggerService {
  /**
   * Logs an info message with optional context.
   * @param {string} message - The into message to log
   * @param {LogContext} [context] - Optional context information for the log entry
   */
  info(message: string, context?: LogContext): void;

  /**
   * Logs an error message with optional context.
   * @param {string} message - The error message to log
   * @param {LogContext} [context] - Optional context information for the log entry
   */
  error(message: string, context?: LogContext): void;

  /**
   * Logs a warning message with optional context.
   * @param {string} message - The warning message to log
   * @param {LogContext} [context] - Optional context information for the log entry
   */
  warn(message: string, context?: LogContext): void;

  /**
   * Logs a debug message with optional context.
   * @param {string} message - The debug message to log
   * @param {LogContext} [context] - Optional context information for the log entry
   */
  debug(message: string, context?: LogContext): void;

  /**
   * Shuts down the logger service and releases any resources.
   * @returns {Promise<void>} A promise that resolves when shutdown is complete
   */
  shutdown(): Promise<void>;
}

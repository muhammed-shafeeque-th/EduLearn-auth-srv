import winston, { format, transports } from 'winston';
import LokiTransport from 'winston-loki';
import DailyRotateFile from 'winston-daily-rotate-file';
import { getEnvs } from '@/shared/utils/getEnv';

const { LOKI_URL, SERVICE_NAME, NODE_ENV, LOG_LEVEL } = getEnvs({
  LOKI_URL: 'http://loki:3100',
  SERVICE_NAME: 'auth-service ',
  NODE_ENV: 'development',
  LOG_LEVEL: 'info',
});

// Loki transport for sending logs to Loki
const lokiTransport = new LokiTransport({
  host: LOKI_URL.toString(),
  labels: { app: SERVICE_NAME.toString() },
  json: true, // Send logs as JSON to loki
  batching: true,
  interval: 5000, // Batch logs every 5 seconds
});

// Custom log format for console and file (human-readable)
// In production, Loki will get JSON, so this format is for local debugging
const customConsoleFileFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
  format.errors({ stack: true }), // Include stack trace for errors
  // Capture all other properties as metadata under the 'metadata' key
  format.metadata({ fillExcept: ['timestamp', 'level', 'message', 'stack'] }),
  format.printf(({ timestamp, level, message, stack, ...meta }) => {
    // Use winston's built-in colorizer for all levels
    const colorizer = format.colorize();
    const coloredLevel = colorizer.colorize(level, level.toUpperCase());
    const msg = stack ? `${message}\n${stack}` : message;
    // Ensure metadata is stringified correctly and not empty
    // Winston puts captured metadata under the 'metadata' key by default if format.metadata() is used.
    const metaString =
      meta.metadata && Object.keys(meta.metadata).length > 0
        ? ` ${JSON.stringify(meta.metadata)}`
        : '';
    return `[${timestamp}] [${coloredLevel}]: ${msg}${metaString}`;
  }),
);

// Daily rotating file transport with compression
const dailyRotateFileTransport = new DailyRotateFile({
  filename: `logs/${SERVICE_NAME.toString()}-%DATE%-combined.log`, // Log file name pattern includes service name
  datePattern: 'YYYY-MM-DD', // Rotate daily
  zippedArchive: true, // Compress rotated files
  maxSize: '20m', // Rotate when file size exceeds 20 MB
  maxFiles: '14d', // Retain logs for the last 14 days
  format: format.json(), // Always log to file as JSON for easier parsing by log aggregators later if needed
});

// Console transport (for development/debugging)
const consoleTransport = new transports.Console({
  handleExceptions: true,
  format: format.combine(format.colorize(), format.simple()), // Simple format for console
});

// Create the logger
const logger = winston.createLogger({
  level: LOG_LEVEL.toString(), // Use LOG_LEVEL from env
  // In production, we want JSON for Loki. For console/file, human-readable is fine.
  // Winston allows different formats per transport.
  // The base format here is for the default behavior if no transport-specific format is set.
  // For Loki, we explicitly set json: true in its config.
  // For file, we explicitly set format.json() for consistency.
  format: NODE_ENV.toString() === 'production' ? format.json() : customConsoleFileFormat,
  transports: [
    consoleTransport, // Always keep console for immediate feedback
    dailyRotateFileTransport,
    lokiTransport,
  ],
  exitOnError: false, // Do not exit process on uncaught exceptions
});

// Graceful shutdown for transports (important for batching)
export const shutdownLogger = async () => {
  console.log('Flushing logs before shutdown...');
  // Allow time for batching transports to flush
  await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for batching to complete
  logger.end(() => {
    // Call end() on the logger instance to flush transports
    console.log('Logs flushed. Exiting.');
    process.exit(0);
  });
};

process.on('SIGINT', shutdownLogger);
process.on('SIGTERM', shutdownLogger);

export { logger };

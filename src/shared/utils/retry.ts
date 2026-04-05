// Types for retry configuration
export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  jitter: boolean;
  retryCondition?: (error: any, attempt: number) => boolean;
  onRetry?: (error: any, attempt: number, nextDelay: number) => void;
}

// Default configuration
const DEFAULT_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  jitter: true,
};

// Utility function to calculate delay with exponential backoff
function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  backoffFactor: number,
  jitter: boolean,
): number {
  const exponentialDelay = Math.min(initialDelay * Math.pow(backoffFactor, attempt), maxDelay);

  if (!jitter) {
    return exponentialDelay;
  }

  // Add jitter (±25% of the delay)
  const jitterAmount = exponentialDelay * 0.25 * (Math.random() * 2 - 1);
  return Math.max(0, exponentialDelay + jitterAmount);
}

// Sleep utility
const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Executes a function with retry logic using exponential backoff
 *
 * @param fn - The async function to execute
 * @param config - Retry configuration options
 * @returns Promise that resolves with the function result or rejects with the last error
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {},
): Promise<T> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const {
    maxAttempts,
    initialDelay,
    maxDelay,
    backoffFactor,
    jitter,
    retryCondition = () => true,
    onRetry,
  } = finalConfig;

  let lastError: any;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on last attempt or if retry condition fails
      if (attempt === maxAttempts - 1 || !retryCondition(error, attempt)) {
        throw error;
      }

      const delay = calculateDelay(attempt, initialDelay, maxDelay, backoffFactor, jitter);

      // Call onRetry callback if provided
      onRetry?.(error, attempt + 1, delay);

      await sleep(delay);
    }
  }

  throw lastError;
}

export interface IMetricService {
  /**
   * Measure request duration for a DB operation.
   * @param {string} method - The Name of the method
   * @param {LogContext} [operation] - Optional operation category
   */
  measureDBOperationDuration(
    method: string,
    operation?: 'INSERT' | 'DELETE' | 'SELECT' | 'UPDATE',
  ): () => void;
  measureRequestDuration(method: string): () => void;

  incrementRequestCounter(method: string, statusCode?: number): void;
  incrementDBRequestCounter(operation?: 'INSERT' | 'DELETE' | 'SELECT' | 'UPDATE'): void;

  incrementErrorCounter(method: string, statusCode?: number): void;

  getMetrics(): Promise<string>;
}

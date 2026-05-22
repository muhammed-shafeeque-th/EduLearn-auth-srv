/**
 * Interface for a EventPublish service that provides functionality to publish various events so other services can react to these events.
 */
export default interface IEventPublisher {
  /**
   * Publisher new event with topic and messages.
   */
  publish<T>(
    topic: string,
    data: T,
    key?: any,
    headers?: Record<string, string>,
    options?: {
      schemaOptions?: { keySchema?: string; valueSchema?: string };
      timeout?: number;
    },
  ): Promise<void>;

  publishBatch<T>(
    topic: string,
    messages: Array<{
      data: T;
      key?: any;
      headers?: Record<string, string>;
    }>,
    options?: {
      schemaOptions?: { keySchema?: string; valueSchema?: string };
      timeout?: number;
    },
  ): Promise<void>;
}

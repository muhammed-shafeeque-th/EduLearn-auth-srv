export interface IIdempotencyRepository {
  /**
   * Try to reserve a key.
   * Returns true if first request.
   */
  saveProcessed(idempotencyKey: string, entityId: string): Promise<boolean>;

  /**
   * Get existing entity for key.
   */
  findByIdempotency(idempotencyKey: string): Promise<{
    idempotencyKey: string;
    entityId: string;
  } | null>;
}

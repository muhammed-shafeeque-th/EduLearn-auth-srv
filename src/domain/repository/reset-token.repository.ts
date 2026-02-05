import { ResetToken } from '../entity/reset-token';
import User from '../entity/user';

/**
 * Interface representing a repository for managing tokens.
 */
export interface IPasswordResetTokenRepository {
  /**
   * Creates a Reset token
   * @param token An object which contains properties of token
   * @return Promise that resolve  to void
   */
  createToken(token: ResetToken): Promise<void>;
  /**
   * Finds a token by the associated user ID.
   *
   * @param userId - The ID of the user whose token is being retrieved.
   * @returns A promise that resolves to the token if found, or `undefined` if not found.
   */
  findById(id: string): Promise<ResetToken | null>;

  /**
   * Fetches `IUser` if token is valid (not revoked and expired) and fetches associated user.
   *
   * @param token - The ID of the user whose token is being retrieved.
   * @returns A promise that resolves to the `IUser` token if found, or `null` if not found.
   */
  findUserByToken(token: string): Promise<{ user: User; token: ResetToken } | null>;

  /**
   * Updates the token for a specific user.
   *
   * @param userId - The ID of the user whose token is being updated.
   * @param token - A partial object containing the properties of the token to update.
   * @returns A promise that resolves when the update operation is complete.
   */
  updateToken(userId: string, token: Partial<ResetToken>): Promise<void>;

  deleteExpiredAndUsedTokens(): Promise<void>;
}

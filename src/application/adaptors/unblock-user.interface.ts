import UserUnblockedDto from '../dtos/unblock-user.event-dto';

/**
 * Interface for the UserUnblocked use case.
 *
 * Provides a contract for unblocking a user in the authentication system.
 */
export interface IUserUnblockedUseCase {
  /**
   * Unblocks a user specified by the given dto.
   *
   * @param {UserUnblockedDto} dto - Data transfer object containing user information to be unblocked.
   * @returns {Promise<void>} A promise that resolves when the user has been unblocked.
   */
  execute(dto: UserUnblockedDto): Promise<void>;
}

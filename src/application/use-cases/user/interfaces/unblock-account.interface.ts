import AccountUnblockedDto from '../../../dtos/instructor-unblocked.event-dto';

/**
 * Interface for the UserUnblocked use case.
 *
 * Provides a contract for unblocking a user in the authentication system.
 */
export interface IAccountUnblockedUseCase {
  /**
   * Unblocks a user specified by the given dto.
   *
   * @param {AccountUnblockedDto} dto - Data transfer object containing user information to be unblocked.
   * @returns {Promise<void>} A promise that resolves when the user has been unblocked.
   */
  execute(dto: AccountUnblockedDto): Promise<void>;
}

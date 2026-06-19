import AccountBlockedDto from '../../../dtos/account-blocked.event-dto';

/**
 * Interface for the UserBlocked use case.
 *
 * Provides a contract for blocking a user in the authentication system.
 */
export interface IAccountBlockedUseCase {
  /**
   * Blocks a user specified by the given dto.
   *
   * @param {AccountBlockedDto} dto - Data transfer object containing user information to be blocked.
   * @returns {Promise<void>} A promise that resolves when the user has been blocked.
   */
  execute(dto: AccountBlockedDto): Promise<void>;
}

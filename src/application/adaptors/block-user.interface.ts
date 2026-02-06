import UserBlockedDto from '../dtos/user-blocked.event-dto';

/**
 * Interface for the UserBlocked use case.
 *
 * Provides a contract for blocking a user in the authentication system.
 */
export interface IUserBlockedUseCase {
  /**
   * Blocks a user specified by the given dto.
   *
   * @param {UserBlockedDto} dto - Data transfer object containing user information to be blocked.
   * @returns {Promise<void>} A promise that resolves when the user has been blocked.
   */
  execute(dto: UserBlockedDto): Promise<void>;
}

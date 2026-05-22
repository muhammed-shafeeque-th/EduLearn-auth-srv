import InstructorBlockedDto from '../../../dtos/instructor-blocked.event-dto';

/**
 * Interface for the UserBlocked use case.
 *
 * Provides a contract for blocking a user in the authentication system.
 */
export interface IInstructorBlockedUseCase {
  /**
   * Blocks a user specified by the given dto.
   *
   * @param {InstructorBlockedDto} dto - Data transfer object containing user information to be blocked.
   * @returns {Promise<void>} A promise that resolves when the user has been blocked.
   */
  execute(dto: InstructorBlockedDto): Promise<void>;
}

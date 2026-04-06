import InstructorUnBlockedDto from '../dtos/instructor-unblocked.event-dto';

/**
 * Interface for the UserUnBlocked use case.
 *
 * Provides a contract for blocking a user in the authentication system.
 */
export interface IInstructorUnBlockedUseCase {
  /**
   * Blocks a user specified by the given dto.
   *
   * @param {InstructorUnBlockedDto} dto - Data transfer object containing user information to be Unblocked.
   * @returns {Promise<void>} A promise that resolves when the user has been Unblocked.
   */
  execute(dto: InstructorUnBlockedDto): Promise<void>;
}

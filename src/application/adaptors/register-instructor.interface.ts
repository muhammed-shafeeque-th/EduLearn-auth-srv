import RegisterInstructorEventDto from '../dtos/register-instructor-event.dto';

export default interface IRegisteredInstructorUseCase {
  /**
   * Login user with user credentials
   * @param dto User credentials transferred from client
   * @returns Return accessToken and refreshToken if User exist with given credential else null
   */
  execute(dto: RegisterInstructorEventDto): Promise<void>;
}

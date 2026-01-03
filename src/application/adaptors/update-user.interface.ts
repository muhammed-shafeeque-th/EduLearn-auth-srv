import UserUpdateDto from '../dtos/user-update.dto';

export default interface IUpdateUserUseCase {
  /**
   * Login user with user credentials
   * @param dto User credentials transferred from client
   * @returns Return accessToken and refreshToken if User exist with given credential else null
   */
  execute(dto: UserUpdateDto): Promise<void>;
}

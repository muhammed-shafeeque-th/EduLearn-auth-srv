import LogoutUserDto from '@/application/dtos/logout.dto';

export default interface ILogoutUserUseCase {
  /**
   * Mark user logged out with given userId
   * @param dto User credentials transferred from client
   * @returns Return ID of user who logged out
   */
  execute(dto: LogoutUserDto): Promise<{ userId: string }>;
}

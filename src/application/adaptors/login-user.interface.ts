import LoginUserDto from '@/application/dtos/login-user.dto';
import { IAuthTokens } from '@/shared/types/auth.tokens';

export default interface ILoginUserUseCase {
  /**
   * Login user with user credentials
   * @param dto User credentials transferred from client
   * @returns Return accessToken and refreshToken if User exist with given credential else null
   */
  execute(dto: LoginUserDto): Promise<IAuthTokens>;
}

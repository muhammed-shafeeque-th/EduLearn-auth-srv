import { IAuthTokens } from '@/shared/types/auth.tokens';
import AdminLoginDto from '../dtos/admin-login.dto';

export default interface IAdminLoginUseCase {
  /**
   * Login user with user credentials
   * @param dto User credentials transferred from client
   * @returns Return accessToken and refreshToken if User exist with given credential else null
   */
  execute(dto: AdminLoginDto): Promise<IAuthTokens>;
}

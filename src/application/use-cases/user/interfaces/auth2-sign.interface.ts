import Auth2SignDto from '@/application/dtos/auth2-sign.dto';
import { IAuthTokens } from '@/shared/types/auth.tokens';

export default interface IAuth2SignUseCase {
  /**
   * Creates user with given user data if the use not exist, returns `IUserWithAuthToken`
   * @param dto - User data transferred from client
   * @returns A promise that resolve to `IUserWithAuthToken`
   */
  execute(dto: Auth2SignDto): Promise<IAuthTokens>;
}

import VerifyUserDto from '@/application/dtos/verify-user.dto';
import { IAuthTokens } from '@/shared/types/auth.tokens';

/**
 * Interface representing the use case for verifying user with
 * using a provided refresh token.
 */
export interface IVerifyUserUseCase {
  /**
   * @param dto User data transferred from client
   * @returns A Promise resolve to `IUserWithAuthToken`
   */
  execute(dto: VerifyUserDto): Promise<IAuthTokens>;
}

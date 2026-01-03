import RefreshToken from '@/application/dtos/new-refresh-token.dto';
import { IAuthTokens } from '@/shared/types/auth.tokens';

/**
 * Interface representing the use case for retrieving new authentication tokens
 * using a provided refresh token.
 */
export interface IRefreshTokenUseCase {
  /**
   * @param token Refresh token  to be verified
   * @returns A Promise resolve to `IAuthTokens`
   */
  execute(dto: RefreshToken): Promise<IAuthTokens>;
}

import { CustomJwtClaims } from '@/shared/types';

export default interface ITokenService {
  /**
   * Signs the given data and returns a an Access token.
   * @param data - The data to sign.
   * @returns return the signed token.
   */
  generateAccessToken<T extends CustomJwtClaims>(data: T, secret?: string): string;

  /**
   * Signs the given data and returns a an Refresh token.
   * @param data - The data to sign.
   * @returns A promise that resolves to the signed token.
   */
  generateRefreshToken<T extends CustomJwtClaims>(data: T, secret?: string): string;

  /**
   * Decodes the given token and returns the verified Access token data.
   * @param token - The token to verify.
   * @returns A promise that resolves to the verified data.
   */
  verifyAccessToken<T>(token: string, secret?: string): Promise<T>;

  /**
   * Decodes the given token and returns the verified Refresh token data.
   * @param token - The token to verify.
   * @returns A promise that resolves to the verified data.
   */
  verifyRefreshToken<T>(token: string, secret?: string): Promise<T>;
}

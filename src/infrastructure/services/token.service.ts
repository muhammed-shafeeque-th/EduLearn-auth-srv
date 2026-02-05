import jwt, {
  JsonWebTokenError,
  NotBeforeError,
  TokenExpiredError,
  Secret,
  SignOptions,
  JwtPayload,
} from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { injectable } from 'inversify';
import type { StringValue } from 'ms';
import { getEnvs } from '@/shared/utils/getEnv';
import { AuthenticationError } from '@/shared/errors/auth.error';
import ITokenService from '@/application/services/token.service';
import { CustomJwtClaims, IJwtPayload } from '@/shared/types';

// Export type for consumers (if needed)
export type JwtSignOptions = SignOptions;

// Environment Variables
const {
  JWT_REFRESH_TOKEN_SECRET,
  JWT_ACCESS_TOKEN_SECRET,
  JWT_ACCESS_TOKEN_EXPIRY,
  JWT_REFRESH_TOKEN_SHORT_EXPIRY,
  JWT_TOKEN_AUDIENCE,
  JWT_TOKEN_ISSUER,
  SERVICE_NAME,
} = getEnvs({
  JWT_ACCESS_TOKEN_SECRET: '',
  JWT_REFRESH_TOKEN_SECRET: '',
  JWT_TOKEN_ISSUER: 'auth-service',
  JWT_TOKEN_AUDIENCE: 'edulearn',
  JWT_ACCESS_TOKEN_EXPIRY: '',
  JWT_REFRESH_TOKEN_SHORT_EXPIRY: '',
  SERVICE_NAME: '',
});

// Helper to build Standard Claims
const buildStandardJwtClaims = (): JwtPayload => ({
  // iat intentionally omitted to let JWT lib handle it
  iss: JWT_TOKEN_ISSUER.toString() || `Edulearn_${SERVICE_NAME || 'UnknownService'}`,
  aud: JWT_TOKEN_AUDIENCE.toString() || 'Edulearn',
  jti: uuidv4(),
});

@injectable()
export default class TokenServiceImpl implements ITokenService {
  public constructor() {}

  /**
   * Generic JWT verification with proper error handling and enforced decoding type.
   */
  private async validateJwtToken<T>(
    token: string,
    secret: Secret,
    options?: jwt.VerifyOptions,
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      jwt.verify(token, secret, options || {}, (err, decoded) => {
        if (err) return reject(err);
        if (!decoded) return reject(new AuthenticationError('Invalid token payload.'));
        resolve(decoded as T);
      });
    });
  }

  /**
   * Verifies an Access Token. Catches JWT errors and throws proper AuthenticationError.
   */
  public async verifyAccessToken<T>(token: string, secret?: string): Promise<T> {
    try {
      return await this.validateJwtToken<T>(token, secret ?? JWT_ACCESS_TOKEN_SECRET.toString(), {
        algorithms: ['HS256'],
      });
    } catch (error) {
      this.handleJwtError(error);
    }
  }

  /**
   * Verifies a Refresh Token. Catches JWT errors and throws proper AuthenticationError.
   */
  public async verifyRefreshToken<T>(token: string, secret?: string): Promise<T> {
    try {
      return await this.validateJwtToken<T>(token, secret ?? JWT_REFRESH_TOKEN_SECRET.toString(), {
        algorithms: ['HS256'],
      });
    } catch (error) {
      this.handleJwtError(error);
    }
  }

  /**
   * Generate an Access Token with strong typing and all proper claims.
   */
  public generateAccessToken<T extends CustomJwtClaims>(claimsData: T, secret?: string): string {
    const standardClaims: JwtPayload = buildStandardJwtClaims();
    const claims: IJwtPayload = {
      ...standardClaims,
      ...claimsData,
      sub: claimsData.userId,
      tokenType: 'access',
      // Optionally set exp from claimsData.expiry for short-lived access tokens if needed
    };

    const signOptions: SignOptions = {
      algorithm: 'HS256',
      expiresIn: JWT_ACCESS_TOKEN_EXPIRY.toString() as StringValue,
      ...(claimsData.keyId ? { keyid: claimsData.keyId } : {}),
    };

    return jwt.sign(claims, secret ?? JWT_ACCESS_TOKEN_SECRET.toString(), signOptions);
  }

  /**
   * Generate a Refresh Token. Optionally use expiry in claim or from ENV as fallback.
   */
  public generateRefreshToken<T extends CustomJwtClaims>(claimsData: T, secret?: string): string {
    const standardClaims: JwtPayload = buildStandardJwtClaims();
    const claims: IJwtPayload = {
      ...standardClaims,
      tokenType: 'refresh',
      ...claimsData,
      sub: claimsData.userId,
      // Optionally set exp from claimsData.expiry for custom expiry (refresh token)
    };

    const signOptions: SignOptions = {
      algorithm: 'HS256',
      expiresIn: claimsData.expiry || (JWT_REFRESH_TOKEN_SHORT_EXPIRY.toString() as StringValue),
      ...(claimsData.keyId ? { keyid: claimsData.keyId } : {}),
    };

    return jwt.sign(claims, secret ?? JWT_REFRESH_TOKEN_SECRET.toString(), signOptions);
  }

  /**
   * Centralized error handler for JWT decode exceptions.
   */
  private handleJwtError(error: unknown): never {
    if (error instanceof TokenExpiredError) {
      throw new AuthenticationError('Token has expired. Please login again.');
    }
    if (error instanceof NotBeforeError) {
      throw new AuthenticationError('Token is not active yet.');
    }
    if (error instanceof JsonWebTokenError) {
      throw new AuthenticationError('Invalid token. Please login again.');
    }
    // Unknown error, rethrow
    throw error;
  }
}

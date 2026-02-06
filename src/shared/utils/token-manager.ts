import User from '@/domain/entity/user';
import ms from 'ms';
import type { StringValue } from 'ms';
import { getEnvs } from './getEnv';
import { CustomJwtClaims } from '../types';
const { JWT_REFRESH_TOKEN_LONG_EXPIRY, JWT_REFRESH_TOKEN_SHORT_EXPIRY } = getEnvs({
  JWT_REFRESH_TOKEN_LONG_EXPIRY: '7d',
  JWT_REFRESH_TOKEN_SHORT_EXPIRY: '1d',
});

export const mapUserToToken = (user: User, keyId?: string, exp?: number): CustomJwtClaims => {
  const token = {
    userId: user.getId(),
    username: user.getUsername() || user.getFirstName() + ' ' + (user.getLastName() || ''),
    role: user.getRole(),
    email: user.getEmail(),
    avatar: user.getAvatar(),
    // keyId,
  } as CustomJwtClaims;
  if (exp && typeof exp !== undefined && !!exp) {
    token.expiry = exp;
  }
  if (keyId && typeof keyId !== undefined && !!keyId) {
    token.keyId = keyId;
  }

  return token;
};
export const calculateRefreshTokenExpiryInMs = (rememberMe: boolean = false): number => {
  if (rememberMe) {
    return parseStrValToMs(JWT_REFRESH_TOKEN_LONG_EXPIRY.toString());
  } else {
    return parseStrValToMs(JWT_REFRESH_TOKEN_SHORT_EXPIRY.toString());
  }
};

export function parseStrValToMs(str: string | StringValue): number {
  const result = ms(str as StringValue);
  if (!result) throw new Error(`Invalid time format: ${str}`);
  return result;
}

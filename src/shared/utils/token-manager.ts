import User, { RoleStatus } from '@/domain/entity/user';
import ms from 'ms';
import type { StringValue } from 'ms';
import { getEnvs } from './getEnv';
import { CustomJwtClaims, RolePermissions } from '../types';
const { JWT_REFRESH_TOKEN_LONG_EXPIRY, JWT_REFRESH_TOKEN_SHORT_EXPIRY } = getEnvs({
  JWT_REFRESH_TOKEN_LONG_EXPIRY: '7d',
  JWT_REFRESH_TOKEN_SHORT_EXPIRY: '1d',
});

export const mapUserToToken = (user: User, keyId?: string, exp?: number): CustomJwtClaims => {
  const roles = user.getRoles();
  const roleStatus = user.getRoleStatusMap();
  const userStatus = user.getStatus();

  // Dynamically calculate permissions based on active roles
  const permissions = new Set<string>();

  // Only inject permissions if the entire account is active
  if (!['blocked', 'deleted'].includes(userStatus)) {
    for (const role of roles) {
      if (roleStatus[role] === RoleStatus.ACTIVE && RolePermissions[role]) {
        RolePermissions[role].forEach((perm) => permissions.add(perm));
      }
    }
  }

  const token: CustomJwtClaims = {
    userId: user.getId(),
    username: user.getUsername() || user.getFirstName() + ' ' + (user.getLastName() || ''),
    roles: roles,
    permissions: Array.from(permissions),
    email: user.getEmail(),
    avatar: user.getAvatar(),
  };

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

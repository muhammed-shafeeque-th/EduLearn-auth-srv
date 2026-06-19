import { ResetToken } from '@/domain/entity/reset-token';
import { RefreshToken } from '@/domain/entity/refresh-token';
import { FAKE_TOKEN_ID, FAKE_USER_ID } from './constants';

export function buildResetToken(overrides?: {
  id?: string;
  userId?: string;
  token?: string;
  expiresAt?: Date;
  isUsed?: boolean;
}): ResetToken {
  return new ResetToken(
    overrides?.id ?? FAKE_TOKEN_ID,
    overrides?.userId ?? FAKE_USER_ID,
    overrides?.token ?? 'reset-token-value',
    overrides?.expiresAt ?? new Date(Date.now() + 60_000),
    overrides?.isUsed ?? false,
  );
}

export function buildRefreshToken(overrides?: {
  id?: string;
  userId?: string;
  token?: string;
  expiresAt?: Date;
}): RefreshToken {
  return new RefreshToken(
    overrides?.id ?? FAKE_TOKEN_ID,
    overrides?.userId ?? FAKE_USER_ID,
    overrides?.token ?? 'hashed-refresh-token',
    overrides?.expiresAt ?? new Date(Date.now() + 3_600_000),
  );
}

import RegisterUserDto from '@/application/dtos/register-user.dto';
import LoginUserDto from '@/application/dtos/login-user.dto';
import Auth2SignDto from '@/application/dtos/auth2-sign.dto';
import LogoutUserDto from '@/application/dtos/logout.dto';
import VerifyUserDto from '@/application/dtos/verify-user.dto';
import ChangePasswordDto from '@/application/dtos/change-password.dto';
import ForgotPasswordDto from '@/application/dtos/forgot-password.dto';
import ResetPasswordDto from '@/application/dtos/reset-password.dto';
import RefreshTokenDto from '@/application/dtos/refresh-token.dto';
import { AuthType, UserRoles } from '@/domain/entity/user';
import { FAKE_EMAIL, FAKE_PASSWORD } from './constants';

export function buildRegisterUserDto(
  overrides: Partial<RegisterUserDto> = {},
): RegisterUserDto {
  return RegisterUserDto.create({
    email: FAKE_EMAIL,
    password: FAKE_PASSWORD,
    authType: AuthType.EMAIL,
    firstName: 'Test',
    lastName: 'User',
    avatar: 'avatar-url',
    role: UserRoles.STUDENT,
    ...overrides,
  });
}

export function buildLoginUserDto(overrides: Partial<LoginUserDto> = {}): LoginUserDto {
  return LoginUserDto.create({
    email: FAKE_EMAIL,
    password: FAKE_PASSWORD,
    rememberMe: true,
    ...overrides,
  });
}

export function buildAuth2SignDto(overrides: Partial<Auth2SignDto> = {}): Auth2SignDto {
  return Auth2SignDto.create({
    provider: 'google',
    token: 'provider-token',
    authType: AuthType.OAUTH,
    ...overrides,
  });
}

export function buildLogoutUserDto(userId = 'user-1'): LogoutUserDto {
  return LogoutUserDto.create({ userId });
}

export function buildVerifyUserDto(email = FAKE_EMAIL): VerifyUserDto {
  return VerifyUserDto.create({ email });
}

export function buildChangePasswordDto(
  overrides: Partial<ChangePasswordDto> = {},
): ChangePasswordDto {
  return {
    userId: 'user-123',
    oldPassword: 'old_password',
    newPassword: 'new_password',
    ...overrides,
  };
}

export function buildForgotPasswordDto(email = FAKE_EMAIL): ForgotPasswordDto {
  return { email };
}

export function buildResetPasswordDto(
  overrides: Partial<ResetPasswordDto> = {},
): ResetPasswordDto {
  return ResetPasswordDto.create({
    token: 'reset-token-value',
    password: 'new-password',
    confirmPassword: 'new-password',
    ...overrides,
  });
}

export function buildRefreshTokenDto(refreshToken = 'existing-refresh-token'): RefreshTokenDto {
  return RefreshTokenDto.create({ refreshToken });
}

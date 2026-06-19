import AdminRefreshTokenUseCaseImpl from '@/application/use-cases/admin/impls/admin-refresh.usecase';
import { AuthenticationError } from '@/shared/errors/auth.error';
import { UserRoles } from '@/domain/entity/user';
import { buildRefreshTokenDto } from 'test/fixtures/dto.fixture';
import { createMockTokenService, createObservabilityMocks } from 'test/helpers/test-doubles';

jest.mock('@/shared/utils/getEnv', () => ({
  getEnvs: jest.fn(() => ({
    AUTH_ADMIN_EMAIL: 'admin@edulearn.com',
    AUTH_USER_ID: 'admin-user-id',
  })),
}));

describe('AdminRefreshTokenUseCaseImpl', () => {
  let useCase: AdminRefreshTokenUseCaseImpl;
  let tokenService: ReturnType<typeof createMockTokenService>;

  beforeEach(() => {
    tokenService = createMockTokenService();
    tokenService.generateAccessToken.mockReturnValue('new-admin-access');
    const { logger, tracer } = createObservabilityMocks();
    useCase = new AdminRefreshTokenUseCaseImpl(tokenService, logger, tracer);
  });

  it('returns a new access token for a valid admin refresh token', async () => {
    tokenService.verifyRefreshToken.mockResolvedValue({
      userId: 'admin-user-id',
      keyId: 'token-key',
      role: UserRoles.ADMIN,
      email: 'admin@edulearn.com',
    });

    const result = await useCase.execute(buildRefreshTokenDto('admin-refresh-token'));

    expect(result).toEqual({
      accessToken: 'new-admin-access',
      refreshToken: 'admin-refresh-token',
    });
  });

  it('throws AuthenticationError when token verification fails', async () => {
    tokenService.verifyRefreshToken.mockRejectedValue(new Error('invalid'));
    await expect(useCase.execute(buildRefreshTokenDto())).rejects.toThrow(AuthenticationError);
  });

  it('throws AuthenticationError when token userId does not match admin config', async () => {
    tokenService.verifyRefreshToken.mockResolvedValue({
      userId: 'other-user',
      keyId: 'token-key',
      role: UserRoles.ADMIN,
    });
    await expect(useCase.execute(buildRefreshTokenDto())).rejects.toThrow(AuthenticationError);
  });
});

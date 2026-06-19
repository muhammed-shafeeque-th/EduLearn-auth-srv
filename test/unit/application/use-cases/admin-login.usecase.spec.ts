import AdminLoginUseCaseImpl from '@/application/use-cases/admin/impls/admin-login.usecase';
import UserNotFoundError from '@/shared/errors/not-found.error';
import BadRequestError from '@/shared/errors/bad-request.error';
import { buildLoginUserDto } from 'test/fixtures/dto.fixture';
import {
  createMockTokenService,
  createMockUuidService,
  createObservabilityMocks,
} from 'test/helpers/test-doubles';

jest.mock('@/shared/utils/getEnv', () => ({
  getEnvs: jest.fn(() => ({
    AUTH_ADMIN_EMAIL: 'admin@edulearn.com',
    AUTH_ADMIN_PASSWORD: 'admin-pass',
    AUTH_USER_ID: 'admin-user-id',
    JWT_REFRESH_TOKEN_LONG_EXPIRY: '7d',
    JWT_REFRESH_TOKEN_SHORT_EXPIRY: '1d',
  })),
}));

jest.mock('@/shared/utils/token-manager', () => ({
  calculateRefreshTokenExpiryInMs: jest.fn(() => 604_800_000),
}));

describe('AdminLoginUseCaseImpl', () => {
  let useCase: AdminLoginUseCaseImpl;
  let tokenService: ReturnType<typeof createMockTokenService>;
  let uuidService: ReturnType<typeof createMockUuidService>;

  beforeEach(() => {
    uuidService = createMockUuidService('admin-token-id');
    tokenService = createMockTokenService();
    tokenService.generateAccessToken.mockReturnValue('admin-access');
    tokenService.generateRefreshToken.mockReturnValue('admin-refresh');
    const { logger, tracer } = createObservabilityMocks();
    useCase = new AdminLoginUseCaseImpl(uuidService, tokenService, logger, tracer);
  });

  it('returns admin tokens for valid credentials', async () => {
    const result = await useCase.execute(
      buildLoginUserDto({ email: 'admin@edulearn.com', password: 'admin-pass' }),
    );
    expect(result).toEqual({ accessToken: 'admin-access', refreshToken: 'admin-refresh' });
    expect(tokenService.generateAccessToken).toHaveBeenCalled();
    expect(tokenService.generateRefreshToken).toHaveBeenCalled();
  });

  it('throws UserNotFoundError for non-admin email', async () => {
    await expect(
      useCase.execute(buildLoginUserDto({ email: 'other@example.com', password: 'admin-pass' })),
    ).rejects.toThrow(UserNotFoundError);
  });

  it('throws BadRequestError for invalid password', async () => {
    await expect(
      useCase.execute(buildLoginUserDto({ email: 'admin@edulearn.com', password: 'wrong' })),
    ).rejects.toThrow(BadRequestError);
  });
});

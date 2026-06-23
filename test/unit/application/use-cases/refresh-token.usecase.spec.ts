import RefreshTokenUseCaseImpl from '@/application/use-cases/user/impls/refresh-token.usecase';
import { AuthenticationError } from '@/shared/errors/auth.error';
import { ForbiddenError } from '@/domain/errors/forbidden.error';
import { mapUserToToken } from '@/shared/utils/token-manager';
import { buildRefreshTokenDto } from 'test/fixtures/dto.fixture';
import { buildBlockedUser, buildUser } from 'test/fixtures/user.fixture';
import {
  createMockHashService,
  createMockRefreshTokenRepository,
  createMockTokenService,
  createMockUserRepository,
  createMockUuidService,
  createObservabilityMocks,
} from 'test/helpers/test-doubles';

describe('RefreshTokenUseCaseImpl', () => {
  const keyId = 'token-key-id';
  let useCase: RefreshTokenUseCaseImpl;
  let tokenService: ReturnType<typeof createMockTokenService>;
  let userRepository: ReturnType<typeof createMockUserRepository>;

  beforeEach(() => {
    const hashService = createMockHashService();
    userRepository = createMockUserRepository();
    const uuidService = createMockUuidService();
    tokenService = createMockTokenService();
    const tokenRepository = createMockRefreshTokenRepository();
    const { logger, tracer } = createObservabilityMocks();

    useCase = new RefreshTokenUseCaseImpl(
      hashService,
      userRepository,
      uuidService,
      tokenService,
      tokenRepository,
      logger,
      tracer,
    );
  });

  it('returns a new access token for a valid refresh token', async () => {
    const user = buildUser();
    tokenService.verifyRefreshToken.mockResolvedValue({ userId: user.getId(), keyId });
    userRepository.findById.mockResolvedValue(user);
    tokenService.generateAccessToken.mockReturnValue('new-access-token');

    const result = await useCase.execute(buildRefreshTokenDto());

    expect(tokenService.generateAccessToken).toHaveBeenCalledWith(mapUserToToken(user, keyId));
    expect(result).toEqual({
      accessToken: 'new-access-token',
      refreshToken: 'existing-refresh-token',
    });
  });

  it('throws AuthenticationError when the user no longer exists', async () => {
    tokenService.verifyRefreshToken.mockResolvedValue({ userId: 'missing-user', keyId });
    userRepository.findById.mockResolvedValue(null);
    await expect(useCase.execute(buildRefreshTokenDto())).rejects.toThrow(AuthenticationError);
  });

  it('throws ForbiddenError when the user is blocked', async () => {
    const blockedUser = buildBlockedUser();
    tokenService.verifyRefreshToken.mockResolvedValue({ userId: blockedUser.getId(), keyId });
    userRepository.findById.mockResolvedValue(blockedUser);
    await expect(useCase.execute(buildRefreshTokenDto())).rejects.toThrow(ForbiddenError);
  });
});

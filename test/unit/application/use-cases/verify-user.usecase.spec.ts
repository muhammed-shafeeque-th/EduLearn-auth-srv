import VerifyUserUseCaseImpl from '@/application/use-cases/user/impls/verify-user.usecase';
import UserNotFoundError from '@/shared/errors/not-found.error';
import User, { AuthType } from '@/domain/entity/user';
import { buildVerifyUserDto } from 'test/fixtures/dto.fixture';
import { FAKE_EMAIL } from 'test/fixtures/constants';
import { buildUser } from 'test/fixtures/user.fixture';
import {
  createMockCacheService,
  createMockEventPublisher,
  createMockHashService,
  createMockRefreshTokenRepository,
  createMockTemplateRenderer,
  createMockTokenService,
  createMockUserRepository,
  createMockUuidService,
  createObservabilityMocks,
} from 'test/helpers/test-doubles';

describe('VerifyUserUseCaseImpl', () => {
  let useCase: VerifyUserUseCaseImpl;
  let userRepository: ReturnType<typeof createMockUserRepository>;
  let cacheService: ReturnType<typeof createMockCacheService>;
  let hashService: ReturnType<typeof createMockHashService>;

  beforeEach(() => {
    hashService = createMockHashService();
    userRepository = createMockUserRepository();
    const uuidService = createMockUuidService('uuid-1');
    const tokenService = createMockTokenService();
    tokenService.generateAccessToken.mockReturnValue('access-token');
    tokenService.generateRefreshToken.mockReturnValue('refresh-token');
    cacheService = createMockCacheService();
    const eventPublisher = createMockEventPublisher();
    const tokenRepository = createMockRefreshTokenRepository();
    const renderer = createMockTemplateRenderer();
    const { logger, tracer } = createObservabilityMocks();

    useCase = new VerifyUserUseCaseImpl(
      hashService,
      userRepository,
      uuidService,
      tokenService,
      renderer,
      cacheService,
      eventPublisher,
      tokenRepository,
      logger,
      tracer,
    );
  });

  it('returns tokens immediately when the user already exists', async () => {
    userRepository.findByEmail.mockResolvedValue(buildUser({ email: FAKE_EMAIL }));
    hashService.hash.mockResolvedValue('hashed-refresh-token');

    const result = await useCase.execute(buildVerifyUserDto());

    expect(userRepository.create).not.toHaveBeenCalled();
    expect(result).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' });
  });

  it('creates the user from cache, publishes events, and returns tokens', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    cacheService.get.mockResolvedValue({
      id: 'cached-user',
      email: FAKE_EMAIL,
      authType: AuthType.EMAIL,
      firstName: 'Cached',
      password: 'hashed-password',
    });
    userRepository.create.mockResolvedValue(buildUser({ id: 'cached-user', email: FAKE_EMAIL }));
    hashService.hash.mockResolvedValue('hashed-refresh-token');

    const result = await useCase.execute(buildVerifyUserDto());

    expect(userRepository.create).toHaveBeenCalledWith(expect.any(User));
    expect(result).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' });
  });

  it('throws UserNotFoundError when the user is missing from db and cache', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    cacheService.get.mockResolvedValue(null);
    await expect(useCase.execute(buildVerifyUserDto())).rejects.toThrow(UserNotFoundError);
  });
});

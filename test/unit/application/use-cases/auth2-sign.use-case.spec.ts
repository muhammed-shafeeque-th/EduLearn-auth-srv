import Auth2SignUseCaseImpl from '@/application/use-cases/user/impls/auth2-sign.usecase';
import User, { AuthType } from '@/domain/entity/user';
import { KafkaTopics } from '@/shared/events';
import { mapUserToToken } from '@/shared/utils/token-manager';
import { AuthProvider } from '@/application/adaptors/auth-provider.service';
import { buildAuth2SignDto } from 'test/fixtures/dto.fixture';
import { OAUTH_PROVIDER_PAYLOAD } from 'test/fixtures/constants';
import { buildBlockedUser, buildUser } from 'test/fixtures/user.fixture';
import {
  createMockAuthProviderContext,
  createMockEventPublisher,
  createMockHashService,
  createMockRefreshTokenRepository,
  createMockTemplateRenderer,
  createMockTokenService,
  createMockUserRepository,
  createMockUuidService,
  createObservabilityMocks,
} from 'test/helpers/test-doubles';

describe('Auth2SignUseCaseImpl', () => {
  const mockDto = buildAuth2SignDto();
  const userUuid = 'generated-user-uuid';
  const tokenUuid = 'generated-token-uuid';
  const authProviderExecutor = { execute: jest.fn() };

  let useCase: Auth2SignUseCaseImpl;
  let hashService: ReturnType<typeof createMockHashService>;
  let userRepository: ReturnType<typeof createMockUserRepository>;
  let uuidService: ReturnType<typeof createMockUuidService>;
  let tokenService: ReturnType<typeof createMockTokenService>;
  let eventPublisher: ReturnType<typeof createMockEventPublisher>;
  let tokenRepository: ReturnType<typeof createMockRefreshTokenRepository>;
  let authProviderContext: ReturnType<typeof createMockAuthProviderContext>;
  let renderer: ReturnType<typeof createMockTemplateRenderer>;
  let logger: ReturnType<typeof createObservabilityMocks>['logger'];
  let tracer: ReturnType<typeof createObservabilityMocks>['tracer'];

  beforeEach(() => {
    hashService = createMockHashService();
    userRepository = createMockUserRepository();
    uuidService = createMockUuidService();
    uuidService.generate
      .mockImplementationOnce(() => userUuid)
      .mockImplementationOnce(() => tokenUuid)
      .mockImplementation(() => 'event-id-uuid');
    tokenService = createMockTokenService();
    eventPublisher = createMockEventPublisher();
    tokenRepository = createMockRefreshTokenRepository();
    authProviderExecutor.execute = jest.fn();
    authProviderContext = createMockAuthProviderContext(authProviderExecutor);
    renderer = createMockTemplateRenderer();
    ({ logger, tracer } = createObservabilityMocks());

    useCase = new Auth2SignUseCaseImpl(
      hashService,
      userRepository,
      uuidService,
      tokenService,
      eventPublisher,
      tokenRepository,
      authProviderContext,
      logger,
      tracer,
      renderer,
    );
  });

  it('creates a user and tokens when the account does not exist', async () => {
    authProviderExecutor.execute.mockResolvedValue(OAUTH_PROVIDER_PAYLOAD);
    userRepository.findByEmail.mockResolvedValue(null);
    userRepository.create.mockResolvedValue(
      buildUser({ id: userUuid, email: OAUTH_PROVIDER_PAYLOAD.email }),
    );
    tokenService.generateAccessToken.mockReturnValue('access-token');
    tokenService.generateRefreshToken.mockReturnValue('refresh-token');
    hashService.hash.mockResolvedValue('hashed-refresh-token');

    const userCreateSpy = jest.spyOn(User, 'create');
    const result = await useCase.execute(mockDto);

    expect(authProviderContext.execute).toHaveBeenCalledWith('google' as AuthProvider);
    expect(userRepository.create).toHaveBeenCalled();
    expect(eventPublisher.publish).toHaveBeenCalledWith(
      KafkaTopics.AuthUserCreated,
      expect.objectContaining({ eventType: 'AuthUserCreated' }),
      userUuid,
    );
    expect(renderer.render).toHaveBeenCalledWith('welcome-email.hbs', expect.any(Object));
    expect(result).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' });
    userCreateSpy.mockRestore();
  });

  it('reuses an existing user and only issues tokens', async () => {
    uuidService.generate.mockReset();
    uuidService.generate.mockReturnValue(tokenUuid);
    authProviderExecutor.execute.mockResolvedValue(OAUTH_PROVIDER_PAYLOAD);
    const existingUser = buildUser({
      id: 'existing-user-id',
      email: OAUTH_PROVIDER_PAYLOAD.email,
      authType: AuthType.OAUTH,
      avatar: OAUTH_PROVIDER_PAYLOAD.image,
    });
    userRepository.findByEmail.mockResolvedValue(existingUser);
    tokenService.generateAccessToken.mockReturnValue('access-token');
    tokenService.generateRefreshToken.mockReturnValue('refresh-token');
    hashService.hash.mockResolvedValue('hashed-refresh-token');

    const result = await useCase.execute(mockDto);

    expect(userRepository.create).not.toHaveBeenCalled();
    expect(tokenService.generateAccessToken).toHaveBeenCalledWith(
      mapUserToToken(existingUser, tokenUuid),
    );
    expect(result).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' });
  });

  it('throws ForbiddenError when an existing user is blocked', async () => {
    authProviderExecutor.execute.mockResolvedValue(OAUTH_PROVIDER_PAYLOAD);
    userRepository.findByEmail.mockResolvedValue(
      buildBlockedUser({ email: OAUTH_PROVIDER_PAYLOAD.email, authType: AuthType.OAUTH }),
    );
    await expect(useCase.execute(mockDto)).rejects.toThrow('blocked');
  });

  it('propagates provider errors', async () => {
    authProviderExecutor.execute.mockRejectedValue(new Error('provider-failure'));
    await expect(useCase.execute(mockDto)).rejects.toThrow('provider-failure');
  });
});

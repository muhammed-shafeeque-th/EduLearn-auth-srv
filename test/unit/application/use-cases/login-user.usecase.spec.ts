import LoginUserUseCaseImpl from '@/application/use-cases/user/impls/login-user.usecase';
import UserNotFoundError from '@/shared/errors/not-found.error';
import BadRequestError from '@/shared/errors/bad-request.error';
import { ForbiddenError } from '@/domain/errors/forbidden.error';
import { calculateRefreshTokenExpiryInMs, mapUserToToken } from '@/shared/utils/token-manager';
import { buildLoginUserDto } from 'test/fixtures/dto.fixture';
import { buildOAuthUser, buildUser } from 'test/fixtures/user.fixture';
import {
  FAKE_ACCESS_TOKEN,
  FAKE_EMAIL,
  FAKE_HASHED_PASSWORD,
  FAKE_PASSWORD,
  FAKE_REFRESH_TOKEN,
  FAKE_TOKEN_ID,
  FAKE_USER_ID,
} from 'test/fixtures/constants';
import {
  createMockHashService,
  createMockRefreshTokenRepository,
  createMockTokenService,
  createMockUserRepository,
  createMockUuidService,
  createObservabilityMocks,
} from 'test/helpers/test-doubles';

describe('LoginUserUseCaseImpl', () => {
  const defaultDto = buildLoginUserDto();
  let useCase: LoginUserUseCaseImpl;
  let userRepository: ReturnType<typeof createMockUserRepository>;
  let hashService: ReturnType<typeof createMockHashService>;
  let uuidService: ReturnType<typeof createMockUuidService>;
  let tokenService: ReturnType<typeof createMockTokenService>;
  let tokenRepository: ReturnType<typeof createMockRefreshTokenRepository>;
  let tracer: ReturnType<typeof createObservabilityMocks>['tracer'];
  let logger: ReturnType<typeof createObservabilityMocks>['logger'];
  let user: ReturnType<typeof buildUser>;

  beforeEach(() => {
    userRepository = createMockUserRepository();
    hashService = createMockHashService();
    uuidService = createMockUuidService();
    tokenService = createMockTokenService();
    tokenRepository = createMockRefreshTokenRepository();
    ({ tracer, logger } = createObservabilityMocks());

    user = buildUser({
      id: FAKE_USER_ID,
      email: FAKE_EMAIL,
      password: FAKE_HASHED_PASSWORD,
    });

    useCase = new LoginUserUseCaseImpl(
      hashService,
      userRepository,
      uuidService,
      tokenService,
      tokenRepository,
      tracer,
      logger as never,
    );
  });

  it('returns access and refresh tokens when credentials are valid', async () => {
    userRepository.findByEmail.mockResolvedValue(user);
    hashService.compare.mockResolvedValue(true);
    uuidService.generate.mockReturnValue(FAKE_TOKEN_ID);
    tokenService.generateAccessToken.mockReturnValue(FAKE_ACCESS_TOKEN);
    tokenService.generateRefreshToken.mockReturnValue(FAKE_REFRESH_TOKEN);

    const result = await useCase.execute(defaultDto);

    expect(hashService.compare).toHaveBeenCalledWith(FAKE_HASHED_PASSWORD, FAKE_PASSWORD);
    expect(tokenService.generateAccessToken).toHaveBeenCalledWith(
      mapUserToToken(user, FAKE_TOKEN_ID),
    );
    expect(tokenService.generateRefreshToken).toHaveBeenCalledWith(
      mapUserToToken(user, FAKE_TOKEN_ID, calculateRefreshTokenExpiryInMs(true) / 1000),
    );
    expect(userRepository.update).toHaveBeenCalledWith(FAKE_USER_ID, user);
    expect(result).toEqual({ accessToken: FAKE_ACCESS_TOKEN, refreshToken: FAKE_REFRESH_TOKEN });
  });

  it('throws UserNotFoundError when the user does not exist', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    await expect(useCase.execute(defaultDto)).rejects.toThrow(UserNotFoundError);
  });

  it('throws ForbiddenError when the user is blocked', async () => {
    user.block();
    userRepository.findByEmail.mockResolvedValue(user);
    await expect(useCase.execute(defaultDto)).rejects.toThrow(ForbiddenError);
  });

  it('throws BadRequestError when OAuth user tries email login', async () => {
    userRepository.findByEmail.mockResolvedValue(
      buildOAuthUser({ id: FAKE_USER_ID, email: FAKE_EMAIL }),
    );
    await expect(useCase.execute(defaultDto)).rejects.toThrow(BadRequestError);
  });

  it('throws BadRequestError when the password does not match', async () => {
    userRepository.findByEmail.mockResolvedValue(user);
    hashService.compare.mockResolvedValue(false);
    await expect(useCase.execute(defaultDto)).rejects.toThrow(BadRequestError);
  });
});

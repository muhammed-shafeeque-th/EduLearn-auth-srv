import ResetPasswordUseCaseImpl from '@/application/use-cases/user/impls/reset-password.use-case';
import NotFoundError from '@/shared/errors/not-found.error';
import InvalidTokenError from '@/domain/errors/invalid-token.error';
import { AuthType } from '@/domain/entity/user';
import { buildResetPasswordDto } from 'test/fixtures/dto.fixture';
import { buildOAuthUser } from 'test/fixtures/user.fixture';
import { buildResetToken } from 'test/fixtures/token.fixture';
import {
  createMockHashService,
  createMockResetTokenRepository,
  createMockUserRepository,
  createObservabilityMocks,
} from 'test/helpers/test-doubles';

describe('ResetPasswordUseCaseImpl', () => {
  let useCase: ResetPasswordUseCaseImpl;
  let userRepository: ReturnType<typeof createMockUserRepository>;
  let tokenRepository: ReturnType<typeof createMockResetTokenRepository>;
  let hashService: ReturnType<typeof createMockHashService>;
  let user: ReturnType<typeof buildOAuthUser>;
  let resetToken: ReturnType<typeof buildResetToken>;

  beforeEach(() => {
    userRepository = createMockUserRepository();
    tokenRepository = createMockResetTokenRepository();
    hashService = createMockHashService();
    const { logger, tracer } = createObservabilityMocks();
    user = buildOAuthUser();
    resetToken = buildResetToken();
    useCase = new ResetPasswordUseCaseImpl(
      userRepository,
      tokenRepository,
      hashService,
      logger,
      tracer,
    );
  });

  it('resets the password and marks the token as used', async () => {
    tokenRepository.findUserByToken.mockResolvedValue({ user, token: resetToken });
    hashService.hash.mockResolvedValue('hashed-password');
    userRepository.update.mockResolvedValue(user);

    const result = await useCase.execute(buildResetPasswordDto());

    expect(user.getPassword()).toBe('hashed-password');
    expect(user.getAuthType()).toBe(AuthType.EMAIL);
    expect(resetToken.isUsed).toBe(true);
    expect(result).toEqual({ userId: user.getId() });
  });

  it('throws NotFoundError when the token is invalid', async () => {
    tokenRepository.findUserByToken.mockResolvedValue(null);
    await expect(
      useCase.execute(buildResetPasswordDto({ token: 'invalid-token' })),
    ).rejects.toThrow(NotFoundError);
  });

  it('throws InvalidTokenError when the token is already used', async () => {
    resetToken.markAsUsed();
    tokenRepository.findUserByToken.mockResolvedValue({ user, token: resetToken });
    await expect(useCase.execute(buildResetPasswordDto())).rejects.toThrow(InvalidTokenError);
  });
});

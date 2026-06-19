import LogoutUserUseCaseImpl from '@/application/use-cases/user/impls/logout.usecase';
import UserNotFoundError from '@/shared/errors/not-found.error';
import { UserStatus } from '@/domain/entity/user';
import { buildLogoutUserDto } from 'test/fixtures/dto.fixture';
import { buildActiveUser } from 'test/fixtures/user.fixture';
import {
  createMockRefreshTokenRepository,
  createMockUserRepository,
  createObservabilityMocks,
} from 'test/helpers/test-doubles';

describe('LogoutUserUseCaseImpl', () => {
  let useCase: LogoutUserUseCaseImpl;
  let userRepository: ReturnType<typeof createMockUserRepository>;
  let tokenRepository: ReturnType<typeof createMockRefreshTokenRepository>;
  let user: ReturnType<typeof buildActiveUser>;

  beforeEach(() => {
    userRepository = createMockUserRepository();
    tokenRepository = createMockRefreshTokenRepository();
    const { logger, tracer } = createObservabilityMocks();
    user = buildActiveUser({ id: 'user-1', email: 'john@example.com' });
    useCase = new LogoutUserUseCaseImpl(userRepository, tokenRepository, logger, tracer);
  });

  it('deactivates the user and returns the user id', async () => {
    userRepository.findById.mockResolvedValue(user);
    userRepository.update.mockResolvedValue(user);
    const result = await useCase.execute(buildLogoutUserDto());
    expect(user.getStatus()).toBe(UserStatus.NOT_ACTIVE);
    expect(userRepository.update).toHaveBeenCalledWith('user-1', user);
    expect(result).toEqual({ userId: 'user-1' });
  });

  it('throws UserNotFoundError when the user does not exist', async () => {
    userRepository.findById.mockResolvedValue(null);
    await expect(useCase.execute(buildLogoutUserDto('missing-user'))).rejects.toThrow(
      UserNotFoundError,
    );
  });
});

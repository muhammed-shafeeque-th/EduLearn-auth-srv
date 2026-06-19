import AccountUnblockedUseCaseImpl from '@/application/use-cases/user/impls/account-unblocked.use-case';
import UserNotFoundError from '@/domain/errors/user-not-found.error';
import { UserStatus } from '@/domain/entity/user';
import { buildAccountUnblockedDto } from 'test/fixtures/event-dto.fixture';
import { buildBlockedUser } from 'test/fixtures/user.fixture';
import { createMockUserRepository, createObservabilityMocks } from 'test/helpers/test-doubles';

describe('AccountUnblockedUseCaseImpl', () => {
  let useCase: AccountUnblockedUseCaseImpl;
  let userRepository: ReturnType<typeof createMockUserRepository>;
  let user: ReturnType<typeof buildBlockedUser>;

  beforeEach(() => {
    userRepository = createMockUserRepository();
    const { logger, tracer } = createObservabilityMocks();
    user = buildBlockedUser({ id: 'user-1', email: 'blocked@example.com' });
    useCase = new AccountUnblockedUseCaseImpl(userRepository, logger, tracer);
  });

  it('unblocks the user when no sync payload is provided', async () => {
    userRepository.findById.mockResolvedValue(user);
    await useCase.execute(buildAccountUnblockedDto());
    expect(user.isBlocked()).toBe(false);
    expect(userRepository.update).toHaveBeenCalledWith('user-1', user);
  });

  it('syncs roles and status when payload details are provided', async () => {
    userRepository.findById.mockResolvedValue(user);
    await useCase.execute(buildAccountUnblockedDto({ status: UserStatus.ACTIVE }));
    expect(user.getStatus()).toBe(UserStatus.ACTIVE);
    expect(userRepository.update).toHaveBeenCalledWith('user-1', user);
  });

  it('throws UserNotFoundError when the user does not exist', async () => {
    userRepository.findById.mockResolvedValue(null);
    await expect(
      useCase.execute(buildAccountUnblockedDto({ userId: 'missing-user' })),
    ).rejects.toThrow(UserNotFoundError);
  });
});

import AccountBlockedUseCaseImpl from '@/application/use-cases/user/impls/account-blocked.use-case';
import UserNotFoundError from '@/domain/errors/user-not-found.error';
import { UserStatus } from '@/domain/entity/user';
import { buildAccountBlockedDto } from 'test/fixtures/event-dto.fixture';
import { buildActiveUser } from 'test/fixtures/user.fixture';
import {
  createMockEventPublisher,
  createMockUserRepository,
  createObservabilityMocks,
} from 'test/helpers/test-doubles';

describe('AccountBlockedUseCaseImpl', () => {
  let useCase: AccountBlockedUseCaseImpl;
  let userRepository: ReturnType<typeof createMockUserRepository>;
  let eventPublisher: ReturnType<typeof createMockEventPublisher>;
  let user: ReturnType<typeof buildActiveUser>;

  beforeEach(() => {
    userRepository = createMockUserRepository();
    eventPublisher = createMockEventPublisher();
    const { logger, tracer } = createObservabilityMocks();
    user = buildActiveUser({ id: 'user-1', email: 'blocked@example.com', firstName: 'Blocked' });
    useCase = new AccountBlockedUseCaseImpl(userRepository, eventPublisher, logger, tracer);
  });

  it('blocks the user when no sync payload is provided', async () => {
    userRepository.findById.mockResolvedValue(user);
    await useCase.execute(buildAccountBlockedDto());
    expect(user.isBlocked()).toBe(true);
    expect(userRepository.update).toHaveBeenCalledWith('user-1', user);
  });

  it('syncs roles and status when payload details are provided', async () => {
    userRepository.findById.mockResolvedValue(user);
    await useCase.execute(buildAccountBlockedDto({ status: UserStatus.ACTIVE }));
    expect(user.getStatus()).toBe(UserStatus.ACTIVE);
    expect(userRepository.update).toHaveBeenCalledWith('user-1', user);
  });

  it('throws UserNotFoundError when the user does not exist', async () => {
    userRepository.findById.mockResolvedValue(null);
    await expect(
      useCase.execute(
        buildAccountBlockedDto({ userId: 'missing-user', status: UserStatus.BLOCKED }),
      ),
    ).rejects.toThrow(UserNotFoundError);
  });
});

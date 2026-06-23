import UpdateUserUseCaseImpl from '@/application/use-cases/user/impls/update-user.use-case';
import UserNotFoundError from '@/domain/errors/user-not-found.error';
import { buildUserUpdateDto } from 'test/fixtures/event-dto.fixture';
import { buildUser } from 'test/fixtures/user.fixture';
import {
  createMockEventPublisher,
  createMockUserRepository,
  createObservabilityMocks,
} from 'test/helpers/test-doubles';

describe('UpdateUserUseCaseImpl', () => {
  let useCase: UpdateUserUseCaseImpl;
  let userRepository: ReturnType<typeof createMockUserRepository>;
  let user: ReturnType<typeof buildUser>;

  beforeEach(() => {
    userRepository = createMockUserRepository();
    const eventPublisher = createMockEventPublisher();
    const { logger, tracer } = createObservabilityMocks();
    user = buildUser({ id: 'user-1', firstName: 'John', lastName: 'Doe' });
    useCase = new UpdateUserUseCaseImpl(userRepository, eventPublisher, logger, tracer);
  });

  it('updates the user profile from event payload', async () => {
    userRepository.findById.mockResolvedValue(user);
    await useCase.execute(buildUserUpdateDto({ firstName: 'Updated', lastName: 'Name' }));
    expect(user.getFirstName()).toBe('Updated');
    expect(user.getLastName()).toBe('Name');
    expect(userRepository.update).toHaveBeenCalledWith('user-1', user);
  });

  it('throws UserNotFoundError when the user does not exist', async () => {
    userRepository.findById.mockResolvedValue(null);
    await expect(useCase.execute(buildUserUpdateDto({ userId: 'missing-user' }))).rejects.toThrow(
      UserNotFoundError,
    );
  });
});

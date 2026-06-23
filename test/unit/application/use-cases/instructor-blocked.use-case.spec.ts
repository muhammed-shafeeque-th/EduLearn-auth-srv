import InstructorBlockedUseCaseImpl from '@/application/use-cases/user/impls/instructor-blocked.use-case';
import UserNotFoundError from '@/domain/errors/user-not-found.error';
import { UserRoles } from '@/domain/entity/user';
import { buildInstructorBlockedDto } from 'test/fixtures/event-dto.fixture';
import { buildInstructorUser } from 'test/fixtures/user.fixture';
import {
  createMockEventPublisher,
  createMockUserRepository,
  createObservabilityMocks,
} from 'test/helpers/test-doubles';

describe('InstructorBlockedUseCaseImpl', () => {
  let useCase: InstructorBlockedUseCaseImpl;
  let userRepository: ReturnType<typeof createMockUserRepository>;
  let user: ReturnType<typeof buildInstructorUser>;

  beforeEach(() => {
    userRepository = createMockUserRepository();
    const eventPublisher = createMockEventPublisher();
    const { logger, tracer } = createObservabilityMocks();
    user = buildInstructorUser({ id: 'user-1', email: 'instructor@example.com' });
    useCase = new InstructorBlockedUseCaseImpl(userRepository, eventPublisher, logger, tracer);
  });

  it('blocks the instructor role', async () => {
    userRepository.findById.mockResolvedValue(user);
    await useCase.execute(buildInstructorBlockedDto());
    expect(user.isRoleBlocked(UserRoles.INSTRUCTOR)).toBe(true);
    expect(userRepository.update).toHaveBeenCalledWith('user-1', user);
  });

  it('returns early when instructor role is already blocked', async () => {
    user.blockRole(UserRoles.INSTRUCTOR);
    userRepository.findById.mockResolvedValue(user);
    await useCase.execute(buildInstructorBlockedDto());
    expect(userRepository.update).not.toHaveBeenCalled();
  });

  it('throws UserNotFoundError when the user does not exist', async () => {
    userRepository.findById.mockResolvedValue(null);
    await expect(
      useCase.execute(buildInstructorBlockedDto({ userId: 'missing-user' })),
    ).rejects.toThrow(UserNotFoundError);
  });
});

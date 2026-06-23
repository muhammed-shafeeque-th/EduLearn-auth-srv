import InstructorUnblockedUseCaseImpl from '@/application/use-cases/user/impls/instructor-unblocked.use-case';
import UserNotFoundError from '@/domain/errors/user-not-found.error';
import { UserRoles } from '@/domain/entity/user';
import { buildInstructorUnblockedDto } from 'test/fixtures/event-dto.fixture';
import { buildInstructorUser } from 'test/fixtures/user.fixture';
import { createMockUserRepository, createObservabilityMocks } from 'test/helpers/test-doubles';

describe('InstructorUnblockedUseCaseImpl', () => {
  let useCase: InstructorUnblockedUseCaseImpl;
  let userRepository: ReturnType<typeof createMockUserRepository>;
  let user: ReturnType<typeof buildInstructorUser>;

  beforeEach(() => {
    userRepository = createMockUserRepository();
    const { logger, tracer } = createObservabilityMocks();
    user = buildInstructorUser({ id: 'user-1', email: 'instructor@example.com' });
    user.blockRole(UserRoles.INSTRUCTOR);
    useCase = new InstructorUnblockedUseCaseImpl(userRepository, logger, tracer);
  });

  it('unblocks the instructor role', async () => {
    userRepository.findById.mockResolvedValue(user);
    await useCase.execute(buildInstructorUnblockedDto());
    expect(user.isRoleBlocked(UserRoles.INSTRUCTOR)).toBe(false);
    expect(userRepository.update).toHaveBeenCalledWith('user-1', user);
  });

  it('returns early when instructor role is not blocked', async () => {
    user.unblockRole(UserRoles.INSTRUCTOR);
    userRepository.findById.mockResolvedValue(user);
    await useCase.execute(buildInstructorUnblockedDto());
    expect(userRepository.update).not.toHaveBeenCalled();
  });

  it('throws UserNotFoundError when the user does not exist', async () => {
    userRepository.findById.mockResolvedValue(null);
    await expect(
      useCase.execute(buildInstructorUnblockedDto({ userId: 'missing-user' })),
    ).rejects.toThrow(UserNotFoundError);
  });
});

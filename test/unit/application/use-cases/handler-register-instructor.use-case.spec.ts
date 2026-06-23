import RegisteredInstructorUseCaseImpl from '@/application/use-cases/user/impls/register-instructor.use-case';
import UserNotFoundError from '@/domain/errors/user-not-found.error';
import { buildRegisterInstructorEventDto } from 'test/fixtures/event-dto.fixture';
import { buildUser } from 'test/fixtures/user.fixture';
import {
  createMockEventPublisher,
  createMockUserRepository,
  createObservabilityMocks,
} from 'test/helpers/test-doubles';

describe('RegisteredInstructorUseCaseImpl', () => {
  let useCase: RegisteredInstructorUseCaseImpl;
  let userRepository: ReturnType<typeof createMockUserRepository>;
  let user: ReturnType<typeof buildUser>;

  beforeEach(() => {
    userRepository = createMockUserRepository();
    const eventPublisher = createMockEventPublisher();
    const { logger, tracer } = createObservabilityMocks();
    user = buildUser({ id: 'user-1', email: 'instructor@example.com', firstName: 'Jane' });
    useCase = new RegisteredInstructorUseCaseImpl(userRepository, eventPublisher, logger, tracer);
  });

  it('promotes the user to instructor when the user exists', async () => {
    userRepository.findById.mockResolvedValue(user);
    userRepository.update.mockResolvedValue(user);
    await useCase.execute(buildRegisterInstructorEventDto());
    expect(user.isInstructor()).toBe(true);
    expect(userRepository.update).toHaveBeenCalledWith('user-1', user);
  });

  it('throws UserNotFoundError when the user does not exist', async () => {
    userRepository.findById.mockResolvedValue(null);
    await expect(useCase.execute(buildRegisterInstructorEventDto())).rejects.toThrow(
      UserNotFoundError,
    );
  });
});

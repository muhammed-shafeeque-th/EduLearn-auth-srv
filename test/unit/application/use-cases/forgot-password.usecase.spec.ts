import ForgotPasswordUseCaseImpl from '@/application/use-cases/user/impls/forgot-password.usecase';
import UserNotFoundError from '@/shared/errors/not-found.error';
import { KafkaTopics } from '@/shared/events';
import { buildForgotPasswordDto } from 'test/fixtures/dto.fixture';
import { FAKE_EMAIL, FAKE_EVENT_ID, FAKE_TOKEN_ID, FAKE_USER_ID } from 'test/fixtures/constants';
import { buildUser } from 'test/fixtures/user.fixture';
import {
  createMockEventPublisher,
  createMockResetTokenRepository,
  createMockUserRepository,
  createMockUuidService,
  createObservabilityMocks,
} from 'test/helpers/test-doubles';

describe('ForgotPasswordUseCaseImpl', () => {
  const FAKE_TOKEN_VALUE = 'reset-token-value';
  const FAKE_RESET_LINK = `http://localhost:9000/auth/reset-password?token=${FAKE_TOKEN_VALUE}`;
  let useCase: ForgotPasswordUseCaseImpl;
  let userRepository: ReturnType<typeof createMockUserRepository>;
  let tokenRepository: ReturnType<typeof createMockResetTokenRepository>;
  let eventPublisher: ReturnType<typeof createMockEventPublisher>;
  let user: ReturnType<typeof buildUser>;

  beforeEach(() => {
    userRepository = createMockUserRepository();
    const uuidService = createMockUuidService();
    uuidService.generate
      .mockImplementationOnce(() => FAKE_TOKEN_ID)
      .mockImplementationOnce(() => FAKE_TOKEN_VALUE)
      .mockImplementation(() => FAKE_EVENT_ID);
    tokenRepository = createMockResetTokenRepository();
    eventPublisher = createMockEventPublisher();
    const { logger, tracer } = createObservabilityMocks();
    user = buildUser({ id: FAKE_USER_ID, email: FAKE_EMAIL, firstName: 'John' });
    useCase = new ForgotPasswordUseCaseImpl(
      userRepository,
      uuidService,
      tokenRepository,
      eventPublisher,
      logger,
      tracer,
    );
  });

  it('creates a reset token and publishes a notification event', async () => {
    userRepository.findByEmail.mockResolvedValue(user);
    const result = await useCase.execute(buildForgotPasswordDto());
    expect(tokenRepository.createToken).toHaveBeenCalled();
    expect(result.link).toBe(FAKE_RESET_LINK);
    expect(result.user).toBe(user);
    expect(eventPublisher.publish).toHaveBeenCalledWith(
      KafkaTopics.NotificationRequestAuthForgotPassword,
      expect.objectContaining({ eventType: 'ForgotPasswordRequestEvent' }),
      FAKE_USER_ID,
    );
  });

  it('throws UserNotFoundError when the user does not exist', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    await expect(useCase.execute(buildForgotPasswordDto('nouser@example.com'))).rejects.toThrow(
      UserNotFoundError,
    );
  });
});

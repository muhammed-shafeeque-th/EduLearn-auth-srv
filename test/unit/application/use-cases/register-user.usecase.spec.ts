import RegisterUserUseCaseImpl from '@/application/use-cases/user/impls/register-user.usecase';
import EmailAlreadyExist from '@/domain/errors/user-already-exist.error';
import User, { AuthType } from '@/domain/entity/user';
import { KafkaTopics } from '@/shared/events';
import { buildRegisterUserDto } from 'test/fixtures/dto.fixture';
import { buildUser } from 'test/fixtures/user.fixture';
import {
  createMockCacheService,
  createMockEventPublisher,
  createMockHashService,
  createMockSpan,
  createMockTracer,
  createMockUserRepository,
  createMockUuidService,
  createObservabilityMocks,
} from 'test/helpers/test-doubles';

describe('RegisterUserUseCaseImpl', () => {
  let useCase: RegisterUserUseCaseImpl;
  let hashService: ReturnType<typeof createMockHashService>;
  let userRepository: ReturnType<typeof createMockUserRepository>;
  let uuidService: ReturnType<typeof createMockUuidService>;
  let eventPublisher: ReturnType<typeof createMockEventPublisher>;
  let cacheService: ReturnType<typeof createMockCacheService>;
  let tracer: ReturnType<typeof createMockTracer>;
  let logger: ReturnType<typeof createObservabilityMocks>['logger'];
  let span: ReturnType<typeof createMockSpan>;

  beforeEach(() => {
    hashService = createMockHashService();
    userRepository = createMockUserRepository();
    uuidService = createMockUuidService();
    eventPublisher = createMockEventPublisher();
    cacheService = createMockCacheService();
    span = createMockSpan();
    tracer = createMockTracer();
    tracer.startSpan.mockReturnValue(span);
    ({ logger } = createObservabilityMocks());

    useCase = new RegisterUserUseCaseImpl(
      hashService,
      userRepository,
      uuidService,
      eventPublisher,
      cacheService,
      logger,
      tracer,
    );
  });

  it('registers a new user and publishes an OTP request event', async () => {
    const dto = buildRegisterUserDto();
    userRepository.findByEmail.mockResolvedValue(null);
    cacheService.get.mockResolvedValue(null);
    hashService.hash.mockResolvedValue('hashed_password');
    uuidService.generate.mockReturnValue('generated-uuid');

    const result = await useCase.execute(dto);

    expect(hashService.hash).toHaveBeenCalledWith(dto.password);
    expect(cacheService.set).toHaveBeenCalledWith(dto.email, expect.any(User));
    expect(eventPublisher.publish).toHaveBeenCalledWith(
      KafkaTopics.AuthOTPRequested,
      expect.objectContaining({ eventType: 'OtpRequestEvent' }),
      expect.any(String),
    );
    expect(result.getEmail()).toBe(dto.email);
  });

  it('returns cached user when registration is retried for the same email', async () => {
    const dto = buildRegisterUserDto();
    const cachedUser = buildUser({ id: 'cached-id', email: dto.email });
    userRepository.findByEmail.mockResolvedValue(null);
    cacheService.get.mockResolvedValue(cachedUser);

    const result = await useCase.execute(dto);

    expect(hashService.hash).not.toHaveBeenCalled();
    expect(eventPublisher.publish).not.toHaveBeenCalled();
    expect(result.getEmail()).toBe(dto.email);
  });

  it('throws EmailAlreadyExist when the user already exists', async () => {
    const dto = buildRegisterUserDto();
    userRepository.findByEmail.mockResolvedValue(buildUser({ email: dto.email }));
    await expect(useCase.execute(dto)).rejects.toThrow(EmailAlreadyExist);
  });

  it('skips password hashing when authType is OAuth', async () => {
    const dto = buildRegisterUserDto({ authType: AuthType.OAUTH });
    userRepository.findByEmail.mockResolvedValue(null);
    cacheService.get.mockResolvedValue(null);
    uuidService.generate.mockReturnValue('generated-uuid');

    await useCase.execute(dto);

    expect(hashService.hash).not.toHaveBeenCalled();
    expect(eventPublisher.publish).toHaveBeenCalled();
  });

  it('logs and rethrows unexpected repository errors', async () => {
    const dto = buildRegisterUserDto();
    userRepository.findByEmail.mockRejectedValue(new Error('DB failure'));
    await expect(useCase.execute(dto)).rejects.toThrow('DB failure');
    expect(tracer.recordException).toHaveBeenCalledWith(span, expect.any(Error));
    expect(tracer.endSpan).toHaveBeenCalledWith(span);
  });
});

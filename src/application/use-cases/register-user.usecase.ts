import { inject, injectable } from 'inversify';
import IRegisterUserUseCase from '../adaptors/register-user.interface';
import { TYPES } from '@/shared/constants/identifiers';
import IHashService from '../services/hash.service';
import IUserRepository from '@/domain/repository/user.repository';
import IUUIDService from '../services/uuid.service';
import RegisterUserDto from '../dtos/register-user.dto';
import EmailAlreadyExist from '@/shared/errors/user-already-exist.error';
import User from '@/domain/entity/user';
import { ICacheService } from '../services/cache.service';
import { AuthType } from '@/shared/types/user-types';
import { TracingService } from '@/infrastructure/observability/tracing/trace.service';
import { LoggingService } from '@/infrastructure/observability/logging/logging.service';
import { KafkaTopics, OtpRequestEvent } from '@/shared/events';
import IEventPublisher from '../services/event-publisher.service';

@injectable()
export default class RegisterUserUseCaseImpl implements IRegisterUserUseCase {
  // private readonly cacheService: ICacheService;
  public constructor(
    @inject(TYPES.IHashService) private readonly hashService: IHashService,
    @inject(TYPES.IUserRepository) private readonly userRepository: IUserRepository,
    @inject(TYPES.IUUIDService) private readonly uuidService: IUUIDService,
    @inject(TYPES.IEventPublisherService) private readonly eventPublisher: IEventPublisher,
    @inject(TYPES.ICacheService) private readonly cacheService: ICacheService,
    @inject(TYPES.TracingService)
    private readonly tracer: TracingService,
    @inject(TYPES.LoggingService)
    private readonly logger: LoggingService,
  ) {}
  public async execute(dto: RegisterUserDto): Promise<User> {
    // Start span
    const span = this.tracer.startSpan('RegisterUserUserCaseImpl.execute', {
      'user.email': dto.email,
    });
    try {
      // Checks whether user already exist with provided email
      const alreadyExist = await this.userRepository.findByEmail(dto.email);

      // Throws an error if user already exist with given email
      if (alreadyExist) {
        this.logger.debug(`User exist with the give email: ${dto.email}`);
        span.setAttribute('email.exist', true);
        throw new EmailAlreadyExist();
      }

      this.logger.debug(`User not exist with the give email: ${dto.email}`);
      span.setAttribute('email.exist', false);

      // Skip password logic if the authType is OAuth2
      let hashedPassword: undefined | string;

      if (dto.authType === AuthType.EMAIL) {
        // Hash the given password to not store password as plain text to db.
        hashedPassword = await this.hashService.hash(dto.password);
        this.logger.debug('User password hashed for user : ' + dto.email);
      }

      // Generate UUID for userId, so to avoid distributed id conflict
      const userUuid = this.uuidService.generate();

      const user = User.create({
        id: userUuid,
        email: dto.email,
        authType: dto.authType,
        firstName: dto.firstName,
        password: hashedPassword,
        lastName: dto.lastName,
        avatar: dto.avatar,
      });

      this.logger.debug('Initiated user data update to redis for temporary storage', {
        email: dto.email,
      });
      // Save user data into redis.
      await this.cacheService.set(user.getEmail().toString(), user);
      this.logger.debug('Completed user data update to redis for temporary storage', {
        email: dto.email,
      });
      // await this.eventPublisher.publish<UserRegisterEvent>(
      //   KafkaTopics.,
      //   {
      //     eventId: this.uuidService.generate(),
      //     eventType: 'UserUpdatedEvent',
      //     timestamp: Date.now(),
      //     email: user.getEmail(),
      //     role: user.getRole(),
      //     userId: user.getId(),
      //     avatar: user.getAvatar(),
      //     createdAt: user.getCreatedAt(),
      //     firstName: user.getFirstName(),
      //     lastName: user.getLastName(),
      //     status: user.getStatus(),
      //   },
      //   user.getId(),
      // );
      await this.eventPublisher.publish<OtpRequestEvent>(
        KafkaTopics.AuthOTPRequested,
        {
          eventId: this.uuidService.generate(),
          eventType: 'OtpRequestEvent',
          otpChannel: 'email',
          timestamp: Date.now(),
          username: user.getFirstName(),
          email: user.getEmail(),
          userId: user.getId(),
        },
        user.getId(),
      );

      this.logger.debug(`user has been registered with email: ${dto.email}`);
      span.setAttribute('registered.email', dto.email);
      return user;
    } catch (error) {
      this.logger.warn(`Error registering user  email: ${dto.email}`, { error });
      this.tracer.recordException(span, error);
      throw error;
    } finally {
      this.tracer.endSpan(span);
    }
  }
}

import { inject, injectable } from 'inversify';
import IRegisterUserUseCase from '../interfaces/register-user.interface';
import { TYPES } from '@/shared/constants/identifiers';
import IHashService from '../../../adaptors/hash.service';
import IUserRepository from '@/domain/repository/user.repository';
import IUUIDService from '../../../adaptors/uuid.service';
import RegisterUserDto from '../../../dtos/register-user.dto';
import EmailAlreadyExist from '@/domain/errors/user-already-exist.error';
import User, { AuthType } from '@/domain/entity/user';
import { ICacheService } from '../../../adaptors/cache.service';
import { KafkaTopics } from '@/shared/events';
import IEventPublisher from '../../../adaptors/event-publisher.service';
import { OtpRequestEvent } from '@/domain/events/types/notification-service.events';
import { ILoggerService } from '../../../adaptors/logger.service';
import { ITraceService } from '../../../adaptors/trace.service';

@injectable()
export default class RegisterUserUseCaseImpl implements IRegisterUserUseCase {
  public constructor(
    @inject(TYPES.IHashService) private readonly _hashService: IHashService,
    @inject(TYPES.IUserRepository) private readonly _userRepository: IUserRepository,
    @inject(TYPES.IUUIDService) private readonly _uuidService: IUUIDService,
    @inject(TYPES.IEventPublisherService) private readonly _eventPublisher: IEventPublisher,
    @inject(TYPES.ICacheService) private readonly cacheService: ICacheService,
    @inject(TYPES.LoggerService)
    private readonly _logger: ILoggerService,
    @inject(TYPES.TraceService)
    private readonly _tracer: ITraceService,
  ) {}
  public async execute(dto: RegisterUserDto): Promise<User> {
    const span = this._tracer.startSpan('RegisterUserUserCaseImpl.execute', {
      'user.email': dto.email,
    });
    try {
      const alreadyExist = await this._userRepository.findByEmail(dto.email);

      // Throws an error if user already exist with given email
      if (alreadyExist) {
        this._logger.debug(`User exist with the give email: ${dto.email}`);
        span.setAttribute('email.exist', true);
        throw new EmailAlreadyExist();
      }

      this._logger.debug(`User not exist with the give email: ${dto.email}`);
      span.setAttribute('email.exist', false);

      // Check for idempotency
      const userCacheExist = await this.cacheService.get<any>(dto.email);
      if (userCacheExist) {
        // update/set to renew ttl
        const user = User.fromPrimitive({
          id: userCacheExist.id,
          email: userCacheExist.email,
          authType: userCacheExist.authType,
          firstName: userCacheExist.firstName,
          password: userCacheExist.password,
          lastName: userCacheExist.lastName,
          avatar: userCacheExist.avatar,
        });
        await this.cacheService.set(user.getEmail(), user);

        return user;
      }

      // Skip password logic if the authType is OAuth2
      let hashedPassword: undefined | string;

      if (dto.authType === AuthType.EMAIL) {
        hashedPassword = await this._hashService.hash(dto.password);
        this._logger.debug('User password hashed for user : ' + dto.email);
      }

      // Generate UUID for userId, so to avoid distributed id conflict
      const userUuid = this._uuidService.generate();

      const user = User.create({
        id: userUuid,
        email: dto.email,
        authType: dto.authType,
        firstName: dto.firstName,
        password: hashedPassword,
        lastName: dto.lastName,
        avatar: dto.avatar,
      });

      this._logger.debug('Initiated user data update to redis for temporary storage', {
        email: dto.email,
      });

      await this.cacheService.set(user.getEmail().toString(), user);
      this._logger.debug('Completed user data update to redis for temporary storage', {
        email: dto.email,
      });
      // await this._eventPublisher.publish<UserRegisterEvent>(
      //   KafkaTopics.,
      //   {
      //     eventId: this._uuidService.generate(),
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
      await this._eventPublisher.publish<OtpRequestEvent>(
        KafkaTopics.AuthOTPRequested,
        {
          eventId: this._uuidService.generate(),
          eventType: 'OtpRequestEvent',
          timestamp: Date.now(),
          source: 'auth-service',
          payload: {
            otpChannel: 'email',
            username: user.getFirstName(),
            email: user.getEmail(),
            userId: user.getId(),
          },
        },
        user.getId(),
      );

      this._logger.debug(`user has been registered with email: ${dto.email}`);
      span.setAttribute('registered.email', dto.email);
      return user;
    } catch (error) {
      this._logger.warn(`Error registering user  email: ${dto.email}`, { error });
      this._tracer.recordException(span, error);
      throw error;
    } finally {
      this._tracer.endSpan(span);
    }
  }
}

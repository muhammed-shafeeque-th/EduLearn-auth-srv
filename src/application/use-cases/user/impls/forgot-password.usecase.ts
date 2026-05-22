import { inject, injectable } from 'inversify';
import { TYPES } from '@/shared/constants/identifiers';
import IUserRepository from '@/domain/repository/user.repository';
import UserNotFoundError from '@/shared/errors/not-found.error';
import { IForgotPasswordUseCase } from '../interfaces/forgot-password.inteface';
import User from '@/domain/entity/user';
import ForgotPasswordDto from '../../../dtos/forgot-password.dto';
import { ResetToken } from '@/domain/entity/reset-token';
import IUUIDService from '../../../adaptors/uuid.service';
import { Time } from '@/shared/constants/time';
import { IPasswordResetTokenRepository } from '@/domain/repository/reset-token.repository';
import { getEnvs } from '@/shared/utils/getEnv';
import IEventPublisher from '../../../adaptors/event-publisher.service';
import { KafkaTopics } from '@/shared/events';
import { ForgotPasswordRequestEvent } from '@/domain/events/types/notification-service.events';
import { ILoggerService } from '../../../adaptors/logger.service';
import { ITraceService } from '../../../adaptors/trace.service';
const { EDULEARN_FRONT_END_URL: frontEndUrl } = getEnvs({
  EDULEARN_FRONT_END_URL: 'http://localhost:9000',
});

@injectable()
export default class ForgotPasswordUseCaseImpl implements IForgotPasswordUseCase {
  private readonly linkExpiryInMinutes = 10;

  public constructor(
    @inject(TYPES.IUserRepository) private readonly _userRepository: IUserRepository,
    @inject(TYPES.IUUIDService) private readonly _uuidService: IUUIDService,
    @inject(TYPES.IResetTokenRepository)
    private readonly _tokenRepository: IPasswordResetTokenRepository,
    @inject(TYPES.IEventPublisherService) private readonly _eventPublisher: IEventPublisher,
    @inject(TYPES.LoggerService)
    private readonly _logger: ILoggerService,
    @inject(TYPES.TraceService)
    private readonly _tracer: ITraceService,
  ) {}
  public async execute(dto: ForgotPasswordDto): Promise<{ user: User; link: string }> {
    return await this._tracer.startActiveSpan('ForgotPasswordUseCaseImpl.execute', async (span) => {
      span.setAttributes({
        userId: dto.email,
      });

      this._logger.debug(`Executing ForgotPasswordUseCaseImpl for user ${dto.email}`);
      // Checks whether user exist with provided email
      const user = await this._userRepository.findByEmail(dto.email);

      // Throws an error if user NOT exist with given email
      if (!user) {
        throw new UserNotFoundError(
          `No user registered with the given email: ${dto.email}. Please check the email address and try again.`,
        );
      }
      const id = this._uuidService.generate();

      const token = this._uuidService.generate();
      const expires = new Date(Date.now() + Time.MINUTES * this.linkExpiryInMinutes);

      const resetToken = new ResetToken(id, user.getId(), token, expires);

      await this._tokenRepository.createToken(resetToken);

      const resetLink = this.generateResetLink(resetToken);

      await this._eventPublisher.publish<ForgotPasswordRequestEvent>(
        KafkaTopics.NotificationRequestAuthForgotPassword,
        {
          eventId: this._uuidService.generate(),
          eventType: 'ForgotPasswordRequestEvent',
          timestamp: Date.now(),
          source: 'auth-service',
          payload: {
            expiryMinutes: this.linkExpiryInMinutes,
            resetLink: resetLink,
            requestSource: 'email',
            username: user.getFirstName(),
            email: user.getEmail(),
            userId: user.getId(),
          },
        },
        user.getId(),
      );

      return { user: user, link: resetLink };
    });
  }

  private generateResetLink(token: ResetToken): string {
    return `${frontEndUrl}/auth/reset-password?token=${token.token}`;
  }
}

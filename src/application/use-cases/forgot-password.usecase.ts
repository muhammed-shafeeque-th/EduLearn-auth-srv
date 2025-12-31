import { inject, injectable } from 'inversify';
import { TYPES } from '@/shared/constants/identifiers';
import IUserRepository from '@/domain/repository/user.repository';
import UserNotFoundError from '@/shared/errors/not-found.error';
import { TracingService } from '@/infrastructure/observability/tracing/trace.service';
import { LoggingService } from '@/infrastructure/observability/logging/logging.service';
import { IForgotPasswordUseCase } from '../adaptors/forgot-password.inteface';
import User from '@/domain/entity/user';
import ForgotPasswordDto from '../dtos/forgot-password.dto';
import { ResetToken } from '@/domain/entity/reset-token';
import IUUIDService from '../services/uuid.service';
import { Time } from '@/shared/constants/time';
import { IPasswordResetTokenRepository } from '@/domain/repository/reset-token.repository ';
import { getEnvs } from '@/shared/utils/getEnv';
import IEventPublisher from '../services/event-publisher.service';
import { ForgotPasswordRequestEvent, KafkaTopics } from '@/shared/events';
const { EDULEARN_FRONT_END_URL: frontEndUrl } = getEnvs({
  EDULEARN_FRONT_END_URL: 'http://localhost:9000',
});

@injectable()
export default class ForgotPasswordUseCaseImpl implements IForgotPasswordUseCase {
  private readonly linkExpiryInMinutes = 10;

  public constructor(
    @inject(TYPES.IUserRepository) private readonly userRepository: IUserRepository,
    @inject(TYPES.IUUIDService) private readonly uuidService: IUUIDService,
    @inject(TYPES.IResetTokenRepository)
    private readonly tokenRepository: IPasswordResetTokenRepository,
    @inject(TYPES.IEventPublisherService) private readonly eventPublisher: IEventPublisher,
    @inject(TYPES.TracingService)
    private readonly tracer: TracingService,
    @inject(TYPES.LoggingService)
    private readonly logger: LoggingService,
  ) {}
  public async execute(dto: ForgotPasswordDto): Promise<{ user: User; link: string }> {
    return await this.tracer.startActiveSpan('ForgotPasswordUseCaseImpl.execute', async (span) => {
      span.setAttributes({
        userId: dto.email,
      });

      this.logger.debug(`Executing ForgotPasswordUseCaseImpl for user ${dto.email}`);
      // Checks whether user exist with provided email
      const user = await this.userRepository.findByEmail(dto.email);

      // Throws an error if user NOT exist with given email
      if (!user) {
        throw new UserNotFoundError(
          `No user registered with the given email: ${dto.email}. Please check the email address and try again.`,
        );
      }
      const id = this.uuidService.generate();

      const token = this.uuidService.generate();
      const expires = new Date(Date.now() + Time.MINUTES * this.linkExpiryInMinutes);

      const resetToken = new ResetToken(id, user.getId(), token, expires);

      await this.tokenRepository.createToken(resetToken);

      const resetLink = this.generateResetLink(resetToken);

      await this.eventPublisher.publish<ForgotPasswordRequestEvent>(
        KafkaTopics.NotificationRequestAuthForgotPassword,
        {
          eventId: this.uuidService.generate(),
          eventType: 'ForgotPasswordRequestEvent',
          expiryMinutes: this.linkExpiryInMinutes,
          resetLink: resetLink,
          requestSource: 'email',
          timestamp: Date.now(),
          username: user.getFirstName(),
          email: user.getEmail(),
          userId: user.getId(),
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

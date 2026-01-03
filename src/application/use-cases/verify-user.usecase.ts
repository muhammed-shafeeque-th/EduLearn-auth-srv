import { inject, injectable } from 'inversify';
import { TYPES } from '@/shared/constants/identifiers';
import IHashService from '../services/hash.service';
import IUserRepository from '@/domain/repository/user.repository';
import IUUIDService from '../services/uuid.service';
import UserNotFoundError from '@/shared/errors/not-found.error';
import { IRefreshTokenRepository } from '@/domain/repository/refresh-token.repository';
import ITokenService from '../services/token.service';
import { RefreshToken } from '@/domain/entity/refresh-token';
import { IVerifyUserUseCase } from '@/application/adaptors/verify-user.interface';
import VerifyUserDto from '@/application/dtos/verify-user.dto';
import { ICacheService } from '@/application/services/cache.service';
import User from '@/domain/entity/user';
import { TracingService } from '@/infrastructure/observability/tracing/trace.service';
import { LoggingService } from '@/infrastructure/observability/logging/logging.service';
import { IAuthTokens } from '@/shared/types/auth.tokens';
import IEventPublisher from '../services/event-publisher.service';
import { KafkaTopics, UserCreatedEvent } from '@/shared/events';
import { calculateRefreshTokenExpiryInMs, mapUserToToken } from '@/shared/utils/token-manager';
import { ITemplateRenderer } from '../services/template-renderer';
import { KafkaEventFactory } from '@/domain/events/entity/event-factory';
import { EmailNotificationEvent } from '@/domain/events/types/email-notification.event';
import { InAppNotificationEvent } from '@/domain/events/types/in-app-notification.event';
import { getEnvs } from '@/shared/utils/getEnv';

type WelcomeEmailTemplateData = {
  userName: string;
  email: string;
  dashboardUrl: string;
  supportEmail: string;
  helpCenterUrl: string;
  blogUrl: string;
  companyAddress: string;
  unsubscribeUrl: string;
  privacyPolicyUrl: string;
  termsUrl: string;
  socialLinks: {
    twitter?: string;
    facebook?: string;
    linkedin?: string;
    instagram?: string;
    youtube?: string;
  };
  currentYear?: number;
  currentDate?: string;
};

// ---- Configuration ----

const config = getEnvs({
  COMPANY_NAME: '',
  COMPANY_ADDRESS: '',
  SUPPORT_EMAIL: '',
  BASE_URL: '',
  TWITTER_URL: '',
  FACEBOOK_URL: '',
  LINKEDIN_URL: '',
  INSTAGRAM_URL: '',
  YOUTUBE_URL: '',
});

@injectable()
export default class VerifyUserUseCaseImpl implements IVerifyUserUseCase {
  private readonly templateName = 'welcome-email.hbs';

  public constructor(
    @inject(TYPES.IHashService) private readonly hashService: IHashService,
    @inject(TYPES.IUserRepository) private readonly userRepository: IUserRepository,
    @inject(TYPES.IUUIDService) private readonly uuidService: IUUIDService,
    @inject(TYPES.ITokenService) private readonly tokenService: ITokenService,
    @inject(TYPES.ITemplateRenderer) private readonly renderer: ITemplateRenderer,
    @inject(TYPES.ICacheService) private readonly cacheService: ICacheService,
    @inject(TYPES.IEventPublisherService) private readonly eventPublisher: IEventPublisher,
    @inject(TYPES.IRefreshTokenRepository)
    private readonly tokenRepository: IRefreshTokenRepository,
    @inject(TYPES.TracingService)
    private readonly tracer: TracingService,
    @inject(TYPES.LoggingService)
    private readonly logger: LoggingService,
  ) {}

  public async execute(dto: VerifyUserDto): Promise<IAuthTokens> {
    return this.tracer.startActiveSpan('VerifyUserUseCaseImpl.execute', async (span) => {
      span.setAttributes({ email: dto.email });
      this.logger.debug(`Executing VerifyUserUseCase for user with email: ${dto.email}`);

      const userExist = await this.userRepository.findByEmail(dto.email);
      if (userExist) return this.generateTokens(userExist);

      // Retrieve user from cache.
      const userCache = await this.cacheService.get<any>(dto.email);
      if (!userCache) {
        this.logger.debug('User not found in cache for verification');
        throw new UserNotFoundError(
          'User not found with provided email while verification, please try again',
        );
      }

      // Instantiate user domain entity
      const user = User.create({
        id: userCache.id,
        email: userCache.email,
        authType: userCache.authType,
        firstName: userCache.firstName,
        password: userCache.password,
        lastName: userCache.lastName,
        createdAt: userCache.createdAt,
        updatedAt: userCache.updatedAt,
      });

      // Mark as verified
      user.verify();

      // Persist the user (throws if duplicate or DB error)
      const created = await this.userRepository.create(user);

      if (!created) {
        this.logger.error('User verification not completed: user could not be created');
        throw new Error("Can't create user with user details");
      }

      await this.publishUserCreatedEvent(user);

      // Prepare & send welcome email and in-app notification asynchronously
      await this.publishWelcomeNotifications(user);

      // Issue tokens for the verified user
      const tokens = await this.generateTokens(user);

      this.logger.debug(
        `Successfully completed the verify use-case for user with email: ${dto.email}`,
      );
      return tokens;
    });
  }

  /**
   * Prepares and returns welcome email data for the template engine.
   */
  private prepareWelcomeEmailData(user: User): WelcomeEmailTemplateData {
    return {
      userName: `${user.getFirstName()} ${user.getLastName()}`,
      email: user.getEmail(),
      dashboardUrl: `${config.BASE_URL}/profile`,
      supportEmail: config.SUPPORT_EMAIL.toString(),
      blogUrl: `${config.BASE_URL}/blogs`,
      helpCenterUrl: `${config.BASE_URL}/help`,
      unsubscribeUrl: `${config.BASE_URL}/unsubscribe?email=${encodeURIComponent(user.getEmail())}`,
      privacyPolicyUrl: `${config.BASE_URL}/privacy`,
      termsUrl: `${config.BASE_URL}/terms`,
      companyAddress: config.COMPANY_ADDRESS.toString(),
      socialLinks: {
        twitter: config.TWITTER_URL.toString(),
        facebook: config.FACEBOOK_URL.toString(),
        linkedin: config.LINKEDIN_URL.toString(),
        instagram: config.INSTAGRAM_URL.toString(),
        youtube: config.YOUTUBE_URL.toString(),
      },
      currentYear: new Date().getFullYear(),
      currentDate: new Date().toISOString().split('T')[0],
    };
  }

  /**
   * Publishes the UserCreated event to Kafka.
   */
  private async publishUserCreatedEvent(user: User): Promise<void> {
    await this.eventPublisher.publish<UserCreatedEvent>(
      KafkaTopics.AuthUserCreated,
      {
        eventId: this.uuidService.generate(),
        eventType: 'AuthUserCreated',
        timestamp: Date.now(),
        email: user.getEmail(),
        role: user.getRole(),
        userId: user.getId(),
        avatar: user.getAvatar(),
        createdAt: user.getCreatedAt(),
        firstName: user.getFirstName(),
        lastName: user.getLastName(),
        status: user.getStatus(),
      },
      user.getId(),
    );
  }

  /**
   * Renders welcome email and dispatches email notification and in-app notification
   */
  private async publishWelcomeNotifications(user: User): Promise<void> {
    const emailData = this.prepareWelcomeEmailData(user);
    const template = await this.renderer.render(this.templateName, emailData);

    // Fire-and-forget, but log errors
    this.eventPublisher
      .publish<EmailNotificationEvent>(
        KafkaTopics.NotificationEmailChannel,
        KafkaEventFactory.createWelcomeEmail(
          user.getEmail(),
          user.getFirstName(),
          user.getId(),
          template,
        ).toEvent(),
        user.getId(),
      )
      .catch((error) => {
        this.logger.error('Error while publishing EmailNotification event', { error });
      });

    this.eventPublisher
      .publish<InAppNotificationEvent>(
        KafkaTopics.NotificationInAppChannel,
        KafkaEventFactory.createWelcomeNotification(user.getId(), 'Auth').toEvent(),
        user.getId(),
      )
      .catch((error) => {
        this.logger.error('Error while publishing InAppNotification event', { error });
      });
  }

  /**
   * Generates access & refresh tokens and persists refresh token securely.
   */
  private async generateTokens(user: User): Promise<IAuthTokens> {
    const tokenId = this.uuidService.generate();
    const userTokenData = mapUserToToken(user, tokenId);

    const accessToken = this.tokenService.generateAccessToken(userTokenData);
    const refreshToken = this.tokenService.generateRefreshToken(userTokenData);

    // Secure the refresh token with hashing
    const hashedToken = await this.hashService.hash(refreshToken);

    const refreshTokenEntity = new RefreshToken(
      tokenId,
      user.getId(),
      hashedToken,
      new Date(Date.now() + calculateRefreshTokenExpiryInMs()),
    );

    // Upsert refresh token in repo
    await this.tokenRepository.upsertToken(refreshTokenEntity);

    return { accessToken, refreshToken };
  }
}

import { inject, injectable } from 'inversify';
import { TYPES } from '@/shared/constants/identifiers';
import IHashService from '../services/hash.service';
import IUserRepository from '@/domain/repository/user.repository';
import { IRefreshTokenRepository } from '@/domain/repository/refresh-token.repository';
import ITokenService from '../services/token.service';
import { RefreshToken } from '@/domain/entity/refresh-token';
import IAuth2SignUseCase from '@/application/adaptors/auth2-sign.interface';
import Auth2SignDto from '@/application/dtos/auth2-sign.dto';
import User from '@/domain/entity/user';
import { TracingService } from '@/infrastructure/observability/tracing/trace.service';
import { LoggingService } from '@/infrastructure/observability/logging/logging.service';
import { IAuthTokens } from '@/shared/types/auth.tokens';
import IEventPublisher from '../services/event-publisher.service';
import { KafkaTopics } from '@/shared/events';
import { calculateRefreshTokenExpiryInMs, mapUserToToken } from '@/shared/utils/token-manager';
import IAuthProviderContext, { AuthProvider } from '../services/auth-provider.service';
import { ForbiddenError } from '@/domain/errors/forbidden.error';
import { KafkaEventFactory } from '@/domain/events/entity/event-factory';
import { InAppNotificationEvent } from '@/domain/events/types/in-app-notification.event';
import { EmailNotificationEvent } from '@/domain/events/types/notification-service.events';
import { ITemplateRenderer } from '../services/template-renderer';
import { WelcomeEmailTemplateData } from '@/shared/types';
import { getEnvs } from '@/shared/utils/getEnv';
import { UserAccountCreatedEvent } from '@/domain/events/types/user-lifecycle.events';
import IUUIDService from '../services/uuid.service';

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
export default class Auth2SignUseCaseImpl implements IAuth2SignUseCase {
  private readonly templateName: string = 'welcome-email.hbs';

  public constructor(
    @inject(TYPES.IHashService) private readonly hashService: IHashService,
    @inject(TYPES.IUserRepository) private readonly userRepository: IUserRepository,
    @inject(TYPES.IUUIDService) private readonly uuidService: IUUIDService,
    @inject(TYPES.ITokenService) private readonly tokenService: ITokenService,
    @inject(TYPES.IEventPublisherService) private readonly eventPublisher: IEventPublisher,
    @inject(TYPES.IRefreshTokenRepository)
    private readonly tokenRepository: IRefreshTokenRepository,
    @inject(TYPES.IAuthProviderContext) private readonly authProviderContext: IAuthProviderContext,
    @inject(TYPES.TracingService) private readonly tracer: TracingService,
    @inject(TYPES.LoggingService) private readonly logger: LoggingService,
    @inject(TYPES.ITemplateRenderer) private readonly renderer: ITemplateRenderer,
  ) {}
  public async execute(dto: Auth2SignDto): Promise<IAuthTokens> {
    return await this.tracer.startActiveSpan('Auth2SignUseCaseImpl.execute', async (span) => {
      span.setAttributes({ provider: dto.provider });
      this.logger.debug(`Executing Auth2Signup for user with provider: ${dto.provider}`);

      const authProviderExecutor = this.authProviderContext.execute(dto.provider as AuthProvider);
      const providerPayload = await authProviderExecutor.execute(dto.token);

      let user = await this.userRepository.findByEmail(providerPayload.email);

      if (!user) {
        this.logger.debug(
          `User not found with email ${providerPayload.email}, creating new account`,
        );
        const userUuid = this.uuidService.generate();
        const [firstName, ...lastNameParts] = providerPayload.username?.split(' ') ?? [''];
        user = User.create({
          id: userUuid,
          email: providerPayload.email,
          authType: dto.authType,
          firstName,
          lastName: lastNameParts.join(' '),
          authProvider: dto.provider,
          avatar: providerPayload.image,
        });

        await this.userRepository.create(user);
        this.logger.debug(`Successfully created user with email ${providerPayload.email}`);

        await this.publishUserCreatedEvent(user);
        await this.publishWelcomeNotifications(user);
      }

      // If blocked, prevent login
      if (user.isBlocked()) {
        this.logger.warn(`Blocked user attempted login: ${user.getId()}`);
        throw new ForbiddenError('Your account is blocked. Please contact support for assistance.');
      }

      user.login();

      const tokens = await this.generateTokens(user);

      this.logger.debug(
        `Successfully completed the Auth2 signup process for user with email: ${providerPayload.email}`,
      );
      return tokens;
    });
  }

  private prepareWelcomeEmailData(user: User): WelcomeEmailTemplateData {
    return {
      userName: `${user.getFirstName()} ${user.getLastName()}`.trim(),
      email: user.getEmail(),
      dashboardUrl: `${config.BASE_URL}/profile`,
      supportEmail: String(config.SUPPORT_EMAIL),
      blogUrl: `${config.BASE_URL}/blogs`,
      helpCenterUrl: `${config.BASE_URL}/help`,
      unsubscribeUrl: `${config.BASE_URL}/unsubscribe?email=${encodeURIComponent(user.getEmail())}`,
      privacyPolicyUrl: `${config.BASE_URL}/privacy`,
      termsUrl: `${config.BASE_URL}/terms`,
      companyAddress: String(config.COMPANY_ADDRESS),
      socialLinks: {
        twitter: String(config.TWITTER_URL),
        facebook: String(config.FACEBOOK_URL),
        linkedin: String(config.LINKEDIN_URL),
        instagram: String(config.INSTAGRAM_URL),
        youtube: String(config.YOUTUBE_URL),
      },
      currentYear: new Date().getFullYear(),
      currentDate: new Date().toISOString().split('T')[0],
    };
  }

  private async publishUserCreatedEvent(user: User): Promise<void> {
    try {
      await this.eventPublisher.publish<UserAccountCreatedEvent>(
        KafkaTopics.AuthUserCreated,
        {
          eventId: this.uuidService.generate(),
          eventType: 'AuthUserCreated',
          timestamp: Date.now(),
          source: 'auth-service',
          payload: {
            email: user.getEmail(),
            roles: user.getRoles(),
            userId: user.getId(),
            avatar: user.getAvatar(),
            createdAt: user.getCreatedAt(),
            firstName: user.getFirstName(),
            lastName: user.getLastName(),
            status: user.getStatus(),
          },
        },
        user.getId(),
      );
    } catch (err) {
      this.logger.error('Failed to publish UserCreated event', {
        error: err,
        userId: user.getId(),
      });
      throw err;
    }
  }

  private async publishWelcomeNotifications(user: User): Promise<void> {
    const emailData = this.prepareWelcomeEmailData(user);
    try {
      const template = await this.renderer.render(this.templateName, emailData);

      // Send email notification
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
          this.logger.error('Error while publishing EmailNotification event', {
            error,
            userId: user.getId(),
          });
        });

      // Send in-app notification
      this.eventPublisher
        .publish<InAppNotificationEvent>(
          KafkaTopics.NotificationInAppChannel,
          KafkaEventFactory.createWelcomeNotification(user.getId(), 'Auth').toEvent(),
          user.getId(),
        )
        .catch((error) => {
          this.logger.error('Error while publishing InAppNotification event', {
            error,
            userId: user.getId(),
          });
        });
    } catch (err) {
      this.logger.error('Failed to render or dispatch welcome notifications', {
        error: err,
        userId: user.getId(),
      });
    }
  }

  private async generateTokens(user: User): Promise<IAuthTokens> {
    const tokenId = this.uuidService.generate();
    const userTokenData = mapUserToToken(user, tokenId);

    const accessToken = this.tokenService.generateAccessToken(userTokenData);
    const refreshToken = this.tokenService.generateRefreshToken(userTokenData);

    // Securely hash the refresh token
    const hashedToken = await this.hashService.hash(refreshToken);

    const refreshTokenEntity = new RefreshToken(
      tokenId,
      user.getId(),
      hashedToken,
      new Date(Date.now() + calculateRefreshTokenExpiryInMs()),
    );

    // Upsert refresh token: either insert or update (idempotent)
    await this.tokenRepository.upsertToken(refreshTokenEntity);

    return { accessToken, refreshToken };
  }
}

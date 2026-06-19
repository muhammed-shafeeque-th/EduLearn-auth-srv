import { inject, injectable } from 'inversify';
import { TYPES } from '@/shared/constants/identifiers';
import IHashService from '../../../adaptors/hash.service';
import IUserRepository from '@/domain/repository/user.repository';
import { IRefreshTokenRepository } from '@/domain/repository/refresh-token.repository';
import ITokenService from '../../../adaptors/token.service';
import { RefreshToken } from '@/domain/entity/refresh-token';
import IAuth2SignUseCase from '@/application/use-cases/user/interfaces/auth2-sign.interface';
import Auth2SignDto from '@/application/dtos/auth2-sign.dto';
import User from '@/domain/entity/user';
import { IAuthTokens } from '@/shared/types/auth.tokens';
import IEventPublisher from '../../../adaptors/event-publisher.service';
import { KafkaTopics } from '@/shared/events';
import { calculateRefreshTokenExpiryInMs, mapUserToToken } from '@/shared/utils/token-manager';
import IAuthProviderContext, { AuthProvider } from '../../../adaptors/auth-provider.service';
import { ForbiddenError } from '@/domain/errors/forbidden.error';
import { KafkaEventFactory } from '@/domain/events/entity/event-factory';
import { InAppNotificationEvent } from '@/domain/events/types/in-app-notification.event';
import { EmailNotificationEvent } from '@/domain/events/types/notification-service.events';
import { ITemplateRenderer } from '../../../adaptors/template-renderer';
import { WelcomeEmailTemplateData } from '@/shared/types';
import { getEnvs } from '@/shared/utils/getEnv';
import { UserAccountCreatedEvent } from '@/domain/events/types/user-lifecycle.events';
import IUUIDService from '../../../adaptors/uuid.service';
import { ILoggerService } from '../../../adaptors/logger.service';
import { ITraceService } from '../../../adaptors/trace.service';

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
    @inject(TYPES.IHashService) private readonly _hashService: IHashService,
    @inject(TYPES.IUserRepository) private readonly _userRepository: IUserRepository,
    @inject(TYPES.IUUIDService) private readonly _uuidService: IUUIDService,
    @inject(TYPES.ITokenService) private readonly _tokenService: ITokenService,
    @inject(TYPES.IEventPublisherService) private readonly _eventPublisher: IEventPublisher,
    @inject(TYPES.IRefreshTokenRepository)
    private readonly _tokenRepository: IRefreshTokenRepository,
    @inject(TYPES.IAuthProviderContext) private readonly authProviderContext: IAuthProviderContext,
    @inject(TYPES.LoggerService)
    private readonly _logger: ILoggerService,
    @inject(TYPES.TraceService)
    private readonly _tracer: ITraceService,
    @inject(TYPES.ITemplateRenderer) private readonly renderer: ITemplateRenderer,
  ) {}
  public async execute(dto: Auth2SignDto): Promise<IAuthTokens> {
    return await this._tracer.startActiveSpan('Auth2SignUseCaseImpl.execute', async (span) => {
      span.setAttributes({ provider: dto.provider });
      this._logger.debug(`Executing Auth2Signup for user with provider: ${dto.provider}`);

      const authProviderExecutor = this.authProviderContext.execute(dto.provider as AuthProvider);
      const providerPayload = await authProviderExecutor.execute(dto.token);

      let user = await this._userRepository.findByEmail(providerPayload.email);

      if (!user) {
        this._logger.debug(
          `User not found with email ${providerPayload.email}, creating new account`,
        );
        const userUuid = this._uuidService.generate();
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

        await this._userRepository.create(user);
        this._logger.debug(`Successfully created user with email ${providerPayload.email}`);

        await this.publishUserCreatedEvent(user);
        await this.publishWelcomeNotifications(user);
      }

      // If blocked, prevent login
      if (user.isBlocked()) {
        this._logger.warn(`Blocked user attempted login: ${user.getId()}`);
        throw new ForbiddenError('Your account is blocked. Please contact support for assistance.');
      }

      user.login();

      const tokens = await this.generateTokens(user);

      this._logger.debug(
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
      await this._eventPublisher.publish<UserAccountCreatedEvent>(
        KafkaTopics.AuthUserCreated,
        {
          eventId: this._uuidService.generate(),
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
      this._logger.error('Failed to publish UserCreated event', {
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
      this._eventPublisher
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
          this._logger.error('Error while publishing EmailNotification event', {
            error,
            userId: user.getId(),
          });
        });

      // Send in-app notification
      this._eventPublisher
        .publish<InAppNotificationEvent>(
          KafkaTopics.NotificationInAppChannel,
          KafkaEventFactory.createWelcomeNotification(user.getId(), 'Auth').toEvent(),
          user.getId(),
        )
        .catch((error) => {
          this._logger.error('Error while publishing InAppNotification event', {
            error,
            userId: user.getId(),
          });
        });
    } catch (err) {
      this._logger.error('Failed to render or dispatch welcome notifications', {
        error: err,
        userId: user.getId(),
      });
    }
  }

  private async generateTokens(user: User): Promise<IAuthTokens> {
    const tokenId = this._uuidService.generate();
    const userTokenData = mapUserToToken(user, tokenId);

    const accessToken = this._tokenService.generateAccessToken(userTokenData);
    const refreshToken = this._tokenService.generateRefreshToken(userTokenData);

    // Securely hash the refresh token
    const hashedToken = await this._hashService.hash(refreshToken);

    const refreshTokenEntity = new RefreshToken(
      tokenId,
      user.getId(),
      hashedToken,
      new Date(Date.now() + calculateRefreshTokenExpiryInMs()),
    );

    // Upsert refresh token: either insert or update (idempotent)
    await this._tokenRepository.upsertToken(refreshTokenEntity);

    return { accessToken, refreshToken };
  }
}

import { inject, injectable } from 'inversify';
import { TYPES } from '@/shared/constants/identifiers';
import IHashService from '../services/hash.service';

import IUserRepository from '@/domain/repository/user.repository';
import IUUIDService from '../services/uuid.service';
import { IRefreshTokenRepository } from '@/domain/repository/refresh-token.repository';
import ITokenService from '../services/token.service';
import { RefreshToken } from '@/domain/entity/refresh-token';
import IAuth2SignUseCase from '@/application/adaptors/auth2-sign.interface';
import Auth2SignDto from '@/application/dtos/auth2-sign.dto';
import User from '@/domain/entity/user';
import { Time } from '@/shared/constants/time';
import { TracingService } from '@/infrastructure/observability/tracing/trace.service';
import { LoggingService } from '@/infrastructure/observability/logging/logging.service';
import { IAuthTokens } from '@/shared/types/auth.tokens';
import IEventPublisher from '../services/event-publisher.service';
import { KafkaTopics, UserCreatedEvent } from '@/shared/events';
import { mapUserToToken } from '@/shared/utils/token-manager';
import IAuthProviderContext, { AuthProvider } from '../services/auth-provider.service';
import { ForbiddenError } from '@/shared/errors/forbidden.error';
// import { AuthType } from '@/shared/types/user-types';

@injectable()
export default class Auth2SignUseCaseImpl implements IAuth2SignUseCase {
  public constructor(
    @inject(TYPES.IHashService) private readonly hashService: IHashService,
    @inject(TYPES.IUserRepository) private readonly userRepository: IUserRepository,
    @inject(TYPES.IUUIDService) private readonly uuidService: IUUIDService,
    @inject(TYPES.ITokenService) private readonly tokenService: ITokenService,
    @inject(TYPES.IEventPublisherService) private readonly eventPublisher: IEventPublisher,
    @inject(TYPES.IRefreshTokenRepository)
    private readonly tokenRepository: IRefreshTokenRepository,
    @inject(TYPES.IAuthProviderContext)
    private readonly authProviderContext: IAuthProviderContext,
    @inject(TYPES.TracingService)
    private readonly tracer: TracingService,
    @inject(TYPES.LoggingService)
    private readonly logger: LoggingService,
  ) {}
  public async execute(dto: Auth2SignDto): Promise<IAuthTokens> {
    return await this.tracer.startActiveSpan('Auth2SignUseCaseImpl.execute', async (span) => {
      span.setAttributes({
        provider: dto.provider,
      });

      this.logger.debug(`Executing Auth2Signup for user with provider: ${dto.provider}`);
      const authProviderExecutor = this.authProviderContext.execute(dto.provider as AuthProvider);

      const providerPayload = await authProviderExecutor.execute(dto.token);

      // Checks whether user exist with provided email
      let user = await this.userRepository.findByEmail(providerPayload.email);

      // Creates user if user not already exists
      if (!user) {
        this.logger.debug(`User not found with email ${providerPayload}, creating new account`);
        // Generate UUID for userId, so to avoid distributed id conflict
        const userUuid = this.uuidService.generate();

        const [firstName, ...lastName] = providerPayload.username!.split(' ');
        user = User.create({
          id: userUuid,
          email: providerPayload.email,
          authType: dto.authType,
          firstName,
          lastName: lastName.join(' '),
          authProvider: dto.provider,
          avatar: providerPayload.image,
        });

        // Mark user as login
        user.login();

        // Save user to db
        await this.userRepository.create(user);
        this.logger.debug(`Successfully created user with email ${providerPayload.email}`);

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

      if (user.isBlocked()) {
        this.logger.warn(`Blocked user attempted login: ${user.getId()}`);
        throw new ForbiddenError('Your account is blocked. Please contact support for assistance.');
      }

      // Generate access token with user data
      const accessToken = this.tokenService.generateAccessToken(mapUserToToken(user));

      // Generate refresh token with user data
      const refreshToken = this.tokenService.generateRefreshToken(mapUserToToken(user));

      // Generate UUID for userId, so to avoid distributed id conflict
      const tokenUuid = this.uuidService.generate();

      // hash refresh token to better security (a good practice)
      const hashedToken = await this.hashService.hash(refreshToken);

      const token = new RefreshToken(
        tokenUuid,
        user.getId(),
        hashedToken,
        new Date(Date.now() + Time.DAYS * 7),
      );

      // Create a token if token not exist with current userId else update.
      await this.tokenRepository.upsertToken(token);
      this.logger.debug(
        'Successfully completed the Auth2 signup process for user with email: ' +
          providerPayload.email,
      );

      return { accessToken, refreshToken };
    });
  }
}

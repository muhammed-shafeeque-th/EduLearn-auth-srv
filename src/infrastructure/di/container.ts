import { Container } from 'inversify';
import PostgresUserRepositoryImpl from '../database/repositories/user-repository';
import { TYPES } from '@/shared/constants/identifiers';
import HashServiceImpl from '../services/hash.service';
import UUIDServiceImpl from '../services/uuid.service';
import RefreshTokenRepositoryImpl from '../database/repositories/refresh-token.repository';
import TokenServiceImpl from '../services/token.service';
import RegisterUserUseCaseImpl from '@/application/use-cases/register-user.usecase';
import LoginUserUseCaseImpl from '@/application/use-cases/login-user.usecase';
import VerifyUserUseCaseImpl from '@/application/use-cases/verify-user.usecase';
import Auth2SignUseCaseImpl from '@/application/use-cases/auth2-sign.usecase';
import LogoutUseCaseImpl from '@/application/use-cases/logout.usecase';

import AuthController from '@/presentation/controllers/auth.controller';
import RefreshTokenUseCaseImpl from '@/application/use-cases/refresh-token.usecase';

import { TracingService } from '../observability/tracing/trace.service';
import { LoggingService } from '../observability/logging/logging.service';
import { initializeTracer } from '../observability/tracing/setup';
import { MetricsService } from '../observability/monitoring/monitoring.service';
import { IRefreshTokenRepository } from '@/domain/repository/refresh-token.repository';
import ChangePasswordUseCaseImpl from '@/application/use-cases/change-password.use-case';
import ResetPasswordUseCaseImpl from '@/application/use-cases/reset-password.use-case';
import ForgotPasswordUseCaseImpl from '@/application/use-cases/forgot-password.usecase';
import { IPasswordResetTokenRepository } from '@/domain/repository/reset-token.repository';
import PasswordResetRepositoryImpl from '../database/repositories/password-reset-token.repository';
import { EventConsumerController } from '@/presentation/controllers/event.consumer.controller';
import IEventPublisher from '@/application/services/event-publisher.service';
import { EventPublisherService } from '../services/event-publisher.service';
import { defaultConfig, KafkaManager } from '../kafka';
import UpdateUserUseCaseImpl from '@/application/use-cases/update-user.use-case';
import AuthProviderContextImpl from '../services/auth-provider-context';
import RegisterInstructorUseCaseImpl from '@/application/use-cases/register-instructor.use-case';
import { RedisCacheService } from '../redis/cache.service';
import { HandlebarsTemplateRendererAdapter } from '../services/template-renderer';
import UserUnblockedUseCaseImpl from '@/application/use-cases/user-unblocked.use-case';
import UserBlockedUseCaseImpl from '@/application/use-cases/block-user.use-case';
import AdminLoginUseCaseImpl from '@/application/use-cases/admin/admin-login.usecase';
import AdminRefreshTokenUseCaseImpl from '@/application/use-cases/admin/admin-refresh.usecase';
import { IIdempotencyRepository } from '@/domain/repository/idempotency.repository';
import { RedisIdempotencyRepository } from '../redis/idempotency.repository';

const container = new Container();
initializeTracer();

/**
 * Bind Interfaces to implementations
 */

// Bind Kafka Manager
container
  .bind<KafkaManager>(TYPES.KafkaManager)
  .toDynamicValue(() => {
    return KafkaManager.getInstance(defaultConfig);
  })
  .inSingletonScope();

//Bind repositories
container.bind(TYPES.IUserRepository).to(PostgresUserRepositoryImpl).inSingletonScope();
container
  .bind<IRefreshTokenRepository>(TYPES.IRefreshTokenRepository)
  .to(RefreshTokenRepositoryImpl)
  .inSingletonScope();
container
  .bind<IPasswordResetTokenRepository>(TYPES.IResetTokenRepository)
  .to(PasswordResetRepositoryImpl)
  .inSingletonScope();
container
  .bind<IIdempotencyRepository>(TYPES.IIdempotencyRepository)
  .to(RedisIdempotencyRepository)
  .inSingletonScope();
// container.bind<RedisCacheService>(TYPES.IRedisCacheService).toDynamicValue(() => RedisCacheService.getInstance());

//Bind use cases
container.bind(TYPES.IRegisterUserUseCase).to(RegisterUserUseCaseImpl).inSingletonScope();
container.bind(TYPES.ILoginUserUseCase).to(LoginUserUseCaseImpl);
container.bind(TYPES.ILogoutUserUseCase).to(LogoutUseCaseImpl);

container.bind(TYPES.IVerifyUserUseCase).to(VerifyUserUseCaseImpl);
container.bind(TYPES.IAuth2SignUseCase).to(Auth2SignUseCaseImpl);

container.bind(TYPES.IChangePasswordUseCase).to(ChangePasswordUseCaseImpl);
container.bind(TYPES.IUnBlockUserUseCase).to(UserUnblockedUseCaseImpl);
container.bind(TYPES.IAdminLoginUseCase).to(AdminLoginUseCaseImpl);
container.bind(TYPES.IAdminRefreshUseCase).to(AdminRefreshTokenUseCaseImpl);
container.bind(TYPES.IBlockUserUseCase).to(UserBlockedUseCaseImpl);
container.bind(TYPES.IResetPasswordUseCase).to(ResetPasswordUseCaseImpl);
container.bind(TYPES.IForgotPasswordUseCase).to(ForgotPasswordUseCaseImpl);
container.bind(TYPES.IUpdateUserUseCase).to(UpdateUserUseCaseImpl);
container.bind(TYPES.IRegisterInstructorUseCase).to(RegisterInstructorUseCaseImpl);

container.bind(TYPES.IRefreshTokenUseCase).to(RefreshTokenUseCaseImpl);

// Bind observability services
container
  .bind<TracingService>(TYPES.TracingService)
  .toDynamicValue(() => {
    return TracingService.getInstance();
  })
  .inSingletonScope();
container
  .bind<LoggingService>(TYPES.LoggingService)
  .toDynamicValue(() => {
    return LoggingService.getInstance();
  })
  .inSingletonScope();
container.bind<MetricsService>(TYPES.MetricsService).to(MetricsService).inSingletonScope();

//Bind services
container.bind(TYPES.IHashService).to(HashServiceImpl).inSingletonScope();
container.bind(TYPES.ITemplateRenderer).to(HandlebarsTemplateRendererAdapter).inSingletonScope();
container.bind(TYPES.IUUIDService).to(UUIDServiceImpl).inSingletonScope();
container.bind(TYPES.ITokenService).to(TokenServiceImpl).inSingletonScope();
container
  .bind(TYPES.ICacheService)
  .toDynamicValue(() => RedisCacheService.getInstance())
  .inSingletonScope();
container.bind(TYPES.IAuthProviderContext).to(AuthProviderContextImpl).inSingletonScope();
container
  .bind<IEventPublisher>(TYPES.IEventPublisherService)
  .to(EventPublisherService)
  .inSingletonScope();

//Bind controllers
container.bind(TYPES.IAuthServiceController).to(AuthController).inSingletonScope();
container.bind(TYPES.IEventConsumerController).to(EventConsumerController).inSingletonScope();

export { container };

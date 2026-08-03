import { Container } from 'inversify';
import PostgresUserRepositoryImpl from '../database/repositories/user-repository';
import { TYPES } from '@/shared/constants/identifiers';
import HashServiceImpl from '../services/hash.service';
import UUIDServiceImpl from '../services/uuid.service';
import RefreshTokenRepositoryImpl from '../database/repositories/refresh-token.repository';
import TokenServiceImpl from '../services/token.service';
import RegisterUserUseCaseImpl from '@/application/use-cases/user/impls/register-user.usecase';
import LoginUserUseCaseImpl from '@/application/use-cases/user/impls/login-user.usecase';
import VerifyUserUseCaseImpl from '@/application/use-cases/user/impls/verify-user.usecase';
import Auth2SignUseCaseImpl from '@/application/use-cases/user/impls/auth2-sign.usecase';
import LogoutUseCaseImpl from '@/application/use-cases/user/impls/logout.usecase';

import AuthController from '@/presentation/grpc/grpc.controller';
import RefreshTokenUseCaseImpl from '@/application/use-cases/user/impls/refresh-token.usecase';

import { TraceService } from '../observability/trace/trace.service';
import { MetricService } from '../observability/metric/metric.service';
import { IRefreshTokenRepository } from '@/domain/repository/refresh-token.repository';
import ChangePasswordUseCaseImpl from '@/application/use-cases/user/impls/change-password.use-case';
import ResetPasswordUseCaseImpl from '@/application/use-cases/user/impls/reset-password.use-case';
import ForgotPasswordUseCaseImpl from '@/application/use-cases/user/impls/forgot-password.usecase';
import { IPasswordResetTokenRepository } from '@/domain/repository/reset-token.repository';
import PasswordResetRepositoryImpl from '../database/repositories/password-reset-token.repository';
import { EventConsumerController } from '@/presentation/kafka/event.consumer.controller';
import IEventPublisher from '@/application/adaptors/event-publisher.service';
import { EventPublisherService } from '../services/event-publisher.service';
import { defaultConfig, KafkaClient, KafkaPublisher } from '../kafka';
import UpdateUserUseCaseImpl from '@/application/use-cases/user/impls/update-user.use-case';
import AuthProviderContextImpl from '../services/auth-provider-context';
import RegisterInstructorUseCaseImpl from '@/application/use-cases/user/impls/register-instructor.use-case';
import { RedisCacheService } from '../redis/cache.service';
import { HandlebarsTemplateRendererAdapter } from '../services/template-renderer';
import AccountUnblockedUseCaseImpl from '@/application/use-cases/user/impls/account-unblocked.use-case';
import AccountBlockedUseCaseImpl from '@/application/use-cases/user/impls/account-blocked.use-case';
import AdminLoginUseCaseImpl from '@/application/use-cases/admin/impls/admin-login.usecase';
import AdminRefreshTokenUseCaseImpl from '@/application/use-cases/admin/impls/admin-refresh.usecase';
import { IIdempotencyRepository } from '@/domain/repository/idempotency.repository';
import { RedisIdempotencyRepository } from '../redis/idempotency.repository';
import InstructorUnblockedUseCaseImpl from '@/application/use-cases/user/impls/instructor-unblocked.use-case';
import InstructorBlockedUseCaseImpl from '@/application/use-cases/user/impls/instructor-blocked.use-case';
import { ITraceService } from '@/application/adaptors/trace.service';
import { ILoggerService } from '@/application/adaptors/logger.service';
import { IMetricService } from '@/application/adaptors/metric.service';
import { LoggerService } from '../observability/logger/logger.service';
import { getEnvs, initializeTracer } from '@edulearn/core';
import { registerShutdown as shutdownTracer } from '@edulearn/core';
import { AppDataSource } from '../database/data-source/data-source';
import { RedisHealthCheck } from '../health/checks/redis.check';
import { DBHealthCheck } from '../health/checks/db.check';
import { GrpcAppServer } from '@/presentation/grpc/server';
import { KafkaAppServer } from '@/presentation/kafka/kafka.server';
import { AuthApplication } from '@/app';
import { createServer } from 'http';
import { AppHealthController } from '../health/health-server';
import { MetricsEngine } from '../observability/metric/setup';
import { KafkaHealthCheck } from '../health/checks/kafka.check';

const {
  NODE_ENV,
  SERVICE_NAME,
  OTLP_ENDPOINT,
  HTTP_PORT: httpPort,
} = getEnvs({
  NODE_ENV: 'development',
  SERVICE_NAME: 'auth-service',
  OTLP_ENDPOINT: 'http://localhost:4318/v1/traces',
  HTTP_PORT: 3000,
});

const container = new Container();

container
  .bind<ReturnType<typeof initializeTracer>>(TYPES.TracerProvider)
  .toDynamicValue(() =>
    initializeTracer({
      environment: String(NODE_ENV),
      serviceName: String(SERVICE_NAME),
      collectorUrl: String(OTLP_ENDPOINT),
    }),
  )
  .inSingletonScope();
shutdownTracer(container.get(TYPES.TracerProvider));

/**
 * Bind Interfaces to implementations
 */

// Bind DB
container.bind<AppDataSource>(TYPES.DBDataSource).to(AppDataSource).inSingletonScope();

// Bind Kafka
container.bind(TYPES.KafkaConfigs).toConstantValue(defaultConfig);
container.bind(TYPES.KafkaClient).to(KafkaClient).inSingletonScope();
container.bind(TYPES.KafkaPublisher).to(KafkaPublisher).inSingletonScope();

//BiKafkaPublishernd repositories
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
container.bind(TYPES.IAccountUnblockedUseCase).to(AccountUnblockedUseCaseImpl);
container.bind(TYPES.IInstructorUnblockedUseCase).to(InstructorUnblockedUseCaseImpl);
container.bind(TYPES.IAdminLoginUseCase).to(AdminLoginUseCaseImpl);
container.bind(TYPES.IAdminRefreshUseCase).to(AdminRefreshTokenUseCaseImpl);
container.bind(TYPES.IAccountBlockedUseCase).to(AccountBlockedUseCaseImpl);
container.bind(TYPES.IInstructorBlockedUseCase).to(InstructorBlockedUseCaseImpl);
container.bind(TYPES.IResetPasswordUseCase).to(ResetPasswordUseCaseImpl);
container.bind(TYPES.IForgotPasswordUseCase).to(ForgotPasswordUseCaseImpl);
container.bind(TYPES.IUpdateUserUseCase).to(UpdateUserUseCaseImpl);
container.bind(TYPES.IRegisterInstructorUseCase).to(RegisterInstructorUseCaseImpl);

container.bind(TYPES.IRefreshTokenUseCase).to(RefreshTokenUseCaseImpl);

// Bind observability services
container.bind<ITraceService>(TYPES.TraceService).to(TraceService).inSingletonScope();
container
  .bind<ILoggerService>(TYPES.LoggerService)
  .toDynamicValue(() => {
    return LoggerService.getInstance();
  })
  .inSingletonScope();
container.bind(TYPES.MetricsEngine).to(MetricsEngine).inSingletonScope();
container.bind<IMetricService>(TYPES.MetricService).to(MetricService).inSingletonScope();

//Bind services
container.bind(TYPES.IHashService).to(HashServiceImpl).inSingletonScope();
container.bind(TYPES.ITemplateRenderer).to(HandlebarsTemplateRendererAdapter).inSingletonScope();
container.bind(TYPES.IUUIDService).to(UUIDServiceImpl).inSingletonScope();
container.bind(TYPES.ITokenService).to(TokenServiceImpl).inSingletonScope();
container.bind(TYPES.ICacheService).to(RedisCacheService).inSingletonScope();
container.bind(TYPES.IAuthProviderContext).to(AuthProviderContextImpl).inSingletonScope();
container
  .bind<IEventPublisher>(TYPES.IEventPublisherService)
  .to(EventPublisherService)
  .inSingletonScope();

//Bind controllers
container.bind(TYPES.IGrpcAppController).to(AuthController).inSingletonScope();
container.bind(TYPES.IEventConsumerController).to(EventConsumerController).inSingletonScope();

// Servers
container
  .bind(TYPES.HttpServer)
  .toDynamicValue(() => {
    return createServer().listen(httpPort, () =>
      console.log(`HttpServer listening on ${httpPort}`),
    );
  })
  .inSingletonScope();
container.bind(TYPES.HealthController).to(AppHealthController).inSingletonScope();
container.bind(TYPES.GrpcAppServer).to(GrpcAppServer).inSingletonScope();
container.bind(TYPES.KafkaAppServer).to(KafkaAppServer).inSingletonScope();

// Health check
container.bind(TYPES.RedisHealthCheck).to(RedisHealthCheck);
container.bind(TYPES.DBHealthCheck).to(DBHealthCheck);
container.bind(TYPES.KafkaHealthCheck).to(KafkaHealthCheck);

// App
container.bind(TYPES.Application).to(AuthApplication);

export { container };

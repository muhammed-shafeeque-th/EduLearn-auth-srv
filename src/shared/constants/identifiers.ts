export const TYPES = {
  // repositories
  IUserRepository: Symbol.for('IUserRepository'),
  IRefreshTokenRepository: Symbol.for('IRefreshTokenRepository'),
  IResetTokenRepository: Symbol.for('IResetTokenRepository'),
  IIdempotencyRepository: Symbol.for('IIdempotencyRepository'),

  // services
  IHashService: Symbol.for('IHashService'),
  ITemplateRenderer: Symbol.for('ITemplateRenderer'),
  IUUIDService: Symbol.for('IUUIDService'),
  ITokenService: Symbol.for('ITokenService'),
  IEventPublisherService: Symbol.for('IEventPublisherService'),
  ICacheService: Symbol.for('ICacheService'),
  IAuthProviderContext: Symbol.for('IAuthProviderContext'),

  // controllers
  IGrpcAppController: Symbol.for('IGrpcAppController'),
  IEventConsumerController: Symbol.for('IEventConsumerController'),

  // use cases
  IRegisterUserUseCase: Symbol.for('IRegisterUserUseCase'),
  IRegisterInstructorUseCase: Symbol.for('IRegisterInstructorUseCase'),
  ILoginUserUseCase: Symbol.for('ILoginUserUseCase'),
  IAdminLoginUseCase: Symbol.for('IAdminLoginUseCase'),
  ILogoutUserUseCase: Symbol.for('ILogoutUserUseCase'),
  IAuth2SignUseCase: Symbol.for('IAuth2SignUseCase'),
  IUpdateUserUseCase: Symbol.for('IUpdateUserUseCase'),
  IGetAllUsersUseCase: Symbol.for('IGetAllUsersUseCase'),
  IRefreshTokenUseCase: Symbol.for('IRefreshTokenUseCase'),
  IAdminRefreshUseCase: Symbol.for('IAdminRefreshUseCase'),
  IVerifyUserUseCase: Symbol.for('IVerifyUserUseCase'),
  ICurrentUserUseCase: Symbol.for('ICurrentUserUseCase'),
  IEmailExistUseCase: Symbol.for('IEmailExistUseCase'),
  IGetAllEmailsUseCase: Symbol.for('IGetAllEmailsUseCase'),
  IChangePasswordUseCase: Symbol.for('IChangePasswordUseCase'),
  IForgotPasswordUseCase: Symbol.for('IForgotPasswordUseCase'),
  IResetPasswordUseCase: Symbol.for('IResetPasswordUseCase'),
  IAccountBlockedUseCase: Symbol.for('IAccountBlockedUseCase'),
  IAccountUnblockedUseCase: Symbol.for('IAccountUnblockedUseCase'),
  IInstructorBlockedUseCase: Symbol.for('IInstructorBlockedUseCase'),
  IInstructorUnblockedUseCase: Symbol.for('IInstructorUnblockedUseCase'),
  IDetailedUserUseCase: Symbol.for('IDetailedUserUseCase'),

  // infrastructure
  TraceService: Symbol.for('TraceService'),
  LoggerService: Symbol.for('LoggerService'),
  MetricService: Symbol.for('MetricService'),
  KafkaClient: Symbol.for('KafkaClient'),
  KafkaPublisher: Symbol.for('KafkaPublisher'),
  DBDataSource: Symbol.for('DBDataSource'),
  TracerProvider: Symbol.for('TracerProvider'),

  // App Servers
  HealthServer: Symbol.for('HealthServer'),
  GrpcAppServer: Symbol.for('GrpcAppServer'),
  KafkaAppServer: Symbol.for('KafkaAppServer'),

  // Health check
  DBHealthCheck: Symbol.for('DBHealthCheck'),
  RedisHealthCheck: Symbol.for('RedisHealthCheck'),

  // Config values
  KafkaConfigs: Symbol.for('KafkaConfigs'),

  Application: Symbol.for('Application'),
};

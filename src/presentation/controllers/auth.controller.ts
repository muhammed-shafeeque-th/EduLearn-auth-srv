import { sendUnaryData, ServerUnaryCall } from '@grpc/grpc-js';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/shared/constants/identifiers';
import { validateDto } from '@/shared/utils/validator';
import { parseMetadata } from '@/shared/utils/parse-metadata';
import { ResponseMapper } from '../mappers/response-mapper';
import { TracingService } from '@/infrastructure/observability/tracing/trace.service';
import { LoggingService } from '@/infrastructure/observability/logging/logging.service';
import { BaseError } from '@/shared/errors/base-error';
import { AuthType, UserRoles } from '@/shared/types/user-types';

import RegisterUserDto from '@/application/dtos/register-user.dto';
import LoginUserDto from '@/application/dtos/login-user.dto';
import Auth2SignDto from '@/application/dtos/auth2-sign.dto';
import LogoutUserDto from '@/application/dtos/logout.dto';
import VerifyUserDto from '@/application/dtos/verify-user.dto';
import RefreshTokenDto from '@/application/dtos/refresh-token.dto';
import ChangePasswordDto from '@/application/dtos/change-password.dto';
import ForgotPasswordDto from '@/application/dtos/forgot-password.dto';
import ResetPasswordDto from '@/application/dtos/reset-password.dto';

import IRegisterUserUseCase from '@/application/adaptors/register-user.interface';
import ILoginUserUseCase from '@/application/adaptors/login-user.interface';
import ILogoutUserUseCase from '@/application/adaptors/logout.interface';
import IAuth2SignUseCase from '@/application/adaptors/auth2-sign.interface';
import { IVerifyUserUseCase } from '@/application/adaptors/verify-user.interface';
import { IChangePasswordUseCase } from '@/application/adaptors/change-password.inteface';
import { IForgotPasswordUseCase } from '@/application/adaptors/forgot-password.inteface';
import { IResetPasswordUseCase } from '@/application/adaptors/reset-password.inteface';

import {
  Auth2SignRequest,
  Auth2SignResponse,
  Error,
  LoginUserRequest,
  LoginUserResponse,
  LogoutUserRequest,
  LogoutUserResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  RegisterUserRequest,
  RegisterUserResponse,
  VerifyUserRequest,
  VerifyUserResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  AdminLoginResponse,
  AdminLoginRequest,
  AdminRefreshResponse,
  AdminRefreshRequest,
} from '@/infrastructure/gRPC/generated/auth_service';
import User from '@/domain/entity/user';
import IAdminLoginUseCase from '@/application/adaptors/admin-login.interface';
import AdminLoginDto from '@/application/dtos/admin-login.dto';
import { IRefreshTokenUseCase } from '@/application/adaptors/refresh-token.interface';

type GrpcCall<TRequest, TResponse> = ServerUnaryCall<TRequest, TResponse>;
type GrpcCallback<TResponse> = sendUnaryData<TResponse>;

@injectable()
export default class AuthController {
  constructor(
    @inject(TYPES.IRegisterUserUseCase) private readonly registerUserUseCase: IRegisterUserUseCase,
    @inject(TYPES.ILoginUserUseCase) private readonly loginUserUseCase: ILoginUserUseCase,
    @inject(TYPES.ILogoutUserUseCase) private readonly logoutUserUseCase: ILogoutUserUseCase,
    @inject(TYPES.IAuth2SignUseCase) private readonly auth2SignUseCase: IAuth2SignUseCase,
    @inject(TYPES.IVerifyUserUseCase) private readonly verifyUserUseCase: IVerifyUserUseCase,
    @inject(TYPES.IRefreshTokenUseCase) private readonly refreshTokenUseCase: IRefreshTokenUseCase,
    @inject(TYPES.IAdminLoginUseCase) private readonly adminLoginUseCase: IAdminLoginUseCase,
    @inject(TYPES.IAdminRefreshUseCase) private readonly adminRefreshUseCase: IRefreshTokenUseCase,
    @inject(TYPES.IChangePasswordUseCase)
    private readonly changePasswordUseCase: IChangePasswordUseCase,
    @inject(TYPES.IForgotPasswordUseCase)
    private readonly forgotPasswordUseCase: IForgotPasswordUseCase,
    @inject(TYPES.IResetPasswordUseCase)
    private readonly resetPasswordUseCase: IResetPasswordUseCase,
    @inject(TYPES.TracingService) private readonly tracer: TracingService,
    @inject(TYPES.LoggingService) private readonly logger: LoggingService,
  ) {}

  private handleWithError<TResponse>(
    method: () => Promise<TResponse>,
    callback: GrpcCallback<TResponse | { error: Error }>,
  ) {
    method().catch((err) => {
      this.logger.warn('Error processing gRPC request', { error: err });
      if (err instanceof BaseError) {
        callback(null, { error: this.mapToError(err) } as any);
      } else {
        callback(err as any, null);
      }
    });
  }

  private async runWithTracingSpan<TResponse>(
    spanName: string,
    logic: (span: any) => Promise<TResponse>,
    callback: GrpcCallback<TResponse | { error: Error }>,
  ) {
    this.handleWithError(async () => {
      return await this.tracer.startActiveSpan(spanName, async (span) => {
        try {
          const result = await logic(span);
          callback(null, result);
          return result;
        } finally {
          if (span?.end) span.end();
        }
      });
    }, callback);
  }

  public registerUser = (
    call: GrpcCall<RegisterUserRequest, RegisterUserResponse>,
    callback: GrpcCallback<RegisterUserResponse>,
  ): void => {
    this.runWithTracingSpan(
      'AuthController.RegisterUser',
      async (span) => {
        parseMetadata(call.metadata, { traceId: { header: 'trace-id' } });

        const { email, role, password, avatar, firstName, lastName, authType } = call.request;
        span?.setAttribute('user.email', email);
        this.logger.info('Handling RegisterUser', { ctx: AuthController.name, email });

        const dto = RegisterUserDto.create({
          email,
          password,
          role: role as UserRoles,
          authType: authType as AuthType,
          firstName,
          lastName,
          avatar,
        });

        await validateDto(dto);
        this.logger.info('Validation successful for RegisterUser parameters', { email });

        const user = await this.registerUserUseCase.execute(dto);
        const response = new ResponseMapper<User, RegisterUserResponse>({
          fields: { userId: (user: User): string => user.getId() },
        }).toResponse(user);

        this.logger.info('RegisterUser completed', { email, userId: user.getId() });
        return response;
      },
      callback,
    );
  };

  public auth2Sign = (
    call: GrpcCall<Auth2SignRequest, Auth2SignResponse>,
    callback: GrpcCallback<Auth2SignResponse>,
  ): void => {
    this.runWithTracingSpan(
      'AuthController.auth2Sign',
      async (span) => {
        const { provider, token, authType } = call.request;
        this.logger.debug('Handling auth2Sign', { provider, authType, ctx: AuthController.name });
        span?.setAttributes?.({ provider, token, authType });

        const dto = Auth2SignDto.create({ authType: authType as AuthType, token, provider });
        await validateDto(dto);

        this.logger.debug('Validation successful for auth2Sign', { provider, authType });
        const { accessToken, refreshToken } = await this.auth2SignUseCase.execute(dto);

        return { success: { accessToken, refreshToken } };
      },
      callback,
    );
  };

  public verifyUser = (
    call: GrpcCall<VerifyUserRequest, VerifyUserResponse>,
    callback: GrpcCallback<VerifyUserResponse>,
  ): void => {
    this.runWithTracingSpan(
      'AuthController.verifyUser',
      async (span) => {
        const { email } = call.request;
        span?.setAttribute('email', email);
        this.logger.debug('Handling verifyUser', { email, ctx: AuthController.name });

        const verifyDto = VerifyUserDto.create({ email });
        await validateDto(verifyDto);

        this.logger.debug('Validation successful for verifyUser', { email });
        const { accessToken, refreshToken } = await this.verifyUserUseCase.execute(verifyDto);

        return { success: { accessToken, refreshToken } };
      },
      callback,
    );
  };
  public adminLogin = (
    call: GrpcCall<AdminLoginRequest, AdminLoginResponse>,
    callback: GrpcCallback<AdminLoginResponse>,
  ): void => {
    this.runWithTracingSpan(
      'AuthController.adminLogin',
      async (span) => {
        const { email, password } = call.request;
        span?.setAttribute('email', email);
        this.logger.debug('Handling adminLogin', { email, ctx: AuthController.name });

        const loginDto = AdminLoginDto.create({ email, password });
        await validateDto(loginDto);

        this.logger.debug('Validation successful for adminLogin', { email });
        const { accessToken, refreshToken } = await this.adminLoginUseCase.execute(loginDto);

        return { success: { accessToken, refreshToken } };
      },
      callback,
    );
  };

  public loginUser = (
    call: GrpcCall<LoginUserRequest, LoginUserResponse>,
    callback: GrpcCallback<LoginUserResponse>,
  ): void => {
    this.runWithTracingSpan(
      'AuthController.loginUser',
      async (span) => {
        const { email, password, rememberMe } = call.request;
        this.logger.debug('Handling loginUser', { email, ctx: AuthController.name });
        span?.setAttributes?.({ email });

        const loginDto = LoginUserDto.create({ email, password, rememberMe });
        await validateDto(loginDto);

        this.logger.debug('Validation successful for loginUser', { email });
        const { accessToken, refreshToken } = await this.loginUserUseCase.execute(loginDto);

        return { success: { accessToken, refreshToken } };
      },
      callback,
    );
  };

  public logoutUser = (
    call: GrpcCall<LogoutUserRequest, LogoutUserResponse>,
    callback: GrpcCallback<LogoutUserResponse>,
  ): void => {
    this.runWithTracingSpan(
      'AuthController.logoutUser',
      async (span) => {
        const { userId } = call.request;
        this.logger.debug('Handling logoutUser', { userId, ctx: AuthController.name });
        span?.setAttributes?.({ userId });

        const logoutDto = LogoutUserDto.create({ userId });
        await validateDto(logoutDto);

        this.logger.debug('Validation successful for logoutUser', { userId });
        const response = await this.logoutUserUseCase.execute(logoutDto);

        return {
          success: { userId: response.userId, message: 'User logged out successfully' },
        };
      },
      callback,
    );
  };

  public refreshToken = (
    call: GrpcCall<RefreshTokenRequest, RefreshTokenResponse>,
    callback: GrpcCallback<RefreshTokenResponse>,
  ): void => {
    this.runWithTracingSpan(
      'AuthController.refreshToken',
      async (span) => {
        const { refreshToken } = call.request;
        span?.setAttributes?.({ refreshToken });

        const dto = RefreshTokenDto.create({ refreshToken });
        await validateDto(dto);
        this.logger.debug('Validation successful for getRefreshToken', { refreshToken });

        const response = await this.refreshTokenUseCase.execute(dto);

        this.logger.debug('getRefreshToken request completed', { refreshToken });
        return { success: response };
      },
      callback,
    );
  };
  public adminRefresh = (
    call: GrpcCall<AdminRefreshRequest, AdminRefreshResponse>,
    callback: GrpcCallback<AdminRefreshResponse>,
  ): void => {
    this.runWithTracingSpan(
      'AuthController.adminRefresh',
      async (span) => {
        const { refreshToken } = call.request;
        span?.setAttributes?.({ refreshToken });

        const dto = RefreshTokenDto.create({ refreshToken });
        await validateDto(dto);
        this.logger.debug('Validation successful for adminRefresh', { refreshToken });

        const response = await this.adminRefreshUseCase.execute(dto);

        this.logger.debug('adminRefresh request completed', { refreshToken });
        return { success: response };
      },
      callback,
    );
  };

  public changePassword = (
    call: GrpcCall<ChangePasswordRequest, ChangePasswordResponse>,
    callback: GrpcCallback<ChangePasswordResponse>,
  ): void => {
    this.runWithTracingSpan(
      'AuthController.changePassword',
      async (span) => {
        const { userId, newPassword, oldPassword } = call.request;
        span?.setAttributes?.({ userId });

        const dto = ChangePasswordDto.create({ userId, newPassword, oldPassword });
        await validateDto(dto);

        this.logger.debug('Validation successful for changePassword', { userId });
        const response = await this.changePasswordUseCase.execute(dto);

        return { success: { updated: !!response } };
      },
      callback,
    );
  };

  public forgotPassword = (
    call: GrpcCall<ForgotPasswordRequest, ForgotPasswordResponse>,
    callback: GrpcCallback<ForgotPasswordResponse>,
  ): void => {
    this.runWithTracingSpan(
      'AuthController.forgotPassword',
      async (span) => {
        const { email } = call.request;
        span?.setAttributes?.({ email });

        const dto = ForgotPasswordDto.create({ email });
        await validateDto(dto);

        this.logger.debug('Validation successful for forgotPassword', { email });
        const { link, user } = await this.forgotPasswordUseCase.execute(dto);

        return {
          success: {
            email: user.getEmail(),
            resetLink: link,
            userId: user.getId(),
            username: `${user.getFirstName()} ${user.getLastName()}`,
          },
        };
      },
      callback,
    );
  };

  public resetPassword = (
    call: GrpcCall<ResetPasswordRequest, ResetPasswordResponse>,
    callback: GrpcCallback<ResetPasswordResponse>,
  ): void => {
    this.runWithTracingSpan(
      'AuthController.resetPassword',
      async (span) => {
        const { token, confirmPassword, password } = call.request;
        span?.setAttributes?.({ token });
        this.logger.info('resetPasswordRequest' + JSON.stringify(call.request, null, 2));

        const dto = ResetPasswordDto.create({ token, confirmPassword, password });
        await validateDto(dto);

        this.logger.debug('Validation successful for resetPassword', { token });
        const result = await this.resetPasswordUseCase.execute(dto);

        return { success: { updated: !!result } };
      },
      callback,
    );
  };

  private mapToError(error: BaseError): Error {
    return {
      code: error.errorCode,
      message: error.message,
      details: error.serializeErrors(),
    };
  }
}

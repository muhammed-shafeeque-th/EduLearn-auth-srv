import { inject, injectable } from 'inversify';
import { TYPES } from '@/shared/constants/identifiers';
import IUUIDService from '../../../adaptors/uuid.service';
import LoginUserDto from '../../../dtos/login-user.dto';
import UserNotFoundError from '@/shared/errors/not-found.error';
import BadRequestError from '@/shared/errors/bad-request.error';
import ITokenService from '../../../adaptors/token.service';
import { IAuthTokens } from '@/shared/types/auth.tokens';
import { calculateRefreshTokenExpiryInMs } from '@/shared/utils/token-manager';
import IAdminLoginUseCase from '../interfaces/admin-login.interface';
import { getEnvs } from '@/shared/utils/getEnv';
import { UserRoles } from '@/domain/entity/user';
import { RolePermissions } from '@/shared/types';
import { ILoggerService } from '@/application/adaptors/logger.service';
import { ITraceService } from '@/application/adaptors/trace.service';

const config = getEnvs({
  AUTH_ADMIN_EMAIL: '',
  AUTH_ADMIN_PASSWORD: '',
  AUTH_USER_ID: '',
});

@injectable()
export default class AdminLoginUseCaseImpl implements IAdminLoginUseCase {
  public constructor(
    @inject(TYPES.IUUIDService) private readonly uuidService: IUUIDService,
    @inject(TYPES.ITokenService) private readonly _tokenService: ITokenService,
    @inject(TYPES.LoggerService)
    private readonly _logger: ILoggerService,
    @inject(TYPES.TraceService)
    private readonly _tracer: ITraceService,
  ) {}

  public async execute(dto: LoginUserDto): Promise<IAuthTokens> {
    return await this._tracer.startActiveSpan('AdminLoginUseCaseImpl.execute', async (span) => {
      span.setAttributes({ email: dto.email });
      this._logger.debug(`Executing AdminLoginUseCaseImpl for user with email: ${dto.email}`);

      // Check whether user exists with provided email
      if (dto.email !== config.AUTH_ADMIN_EMAIL) {
        this._logger.warn(`User not found with email ${dto.email}`);
        throw new UserNotFoundError(
          'user not found with provided email, please check your email and try again',
        );
      }

      // Validate password (for admin login, use constant env password)
      const isPasswordValid = config.AUTH_ADMIN_PASSWORD === dto.password;

      if (!isPasswordValid) {
        this._logger.warn('Admin password does not match configured admin password.');
        throw new BadRequestError('Invalid password. Please try again.');
      }

      const tokenId = this.uuidService.generate();

      const tokenPayload = {
        email: dto.email,
        role: UserRoles.ADMIN as string,
        userId: String(config.AUTH_USER_ID),
        username: 'EduLearn-admin',
        roles: ['admin'],
        permissions: [...RolePermissions.admin, ...RolePermissions.instructor],
      };

      const accessToken = this._tokenService.generateAccessToken({
        ...tokenPayload,
        expiry: calculateRefreshTokenExpiryInMs(true) / 1000,
      });
      const refreshToken = this._tokenService.generateRefreshToken({
        ...tokenPayload,
        keyId: tokenId,
        expiry: calculateRefreshTokenExpiryInMs(true) / 1000,
      });

      this._logger.debug(
        'Successfully completed the login use-case process for user with email: ' + dto.email,
      );

      return { accessToken, refreshToken };
    });
  }
}

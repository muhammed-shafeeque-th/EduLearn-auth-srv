import { inject, injectable } from 'inversify';
import { TYPES } from '@/shared/constants/identifiers';
import ITokenService from '@/application/adaptors/token.service';
import { IAuthTokens } from '@/shared/types/auth.tokens';
import RefreshTokenDto from '@/application/dtos/refresh-token.dto';
import { AuthenticationError } from '@/shared/errors/auth.error';
import { getEnvs } from '@/shared/utils/getEnv';
import { IAdminRefreshTokenUseCase } from '../../admin/interfaces/admin-refresh-token.interface';
import { UserRoles } from '@/domain/entity/user';
import { RolePermissions } from '@/shared/types';
import { ILoggerService } from '@/application/adaptors/logger.service';
import { ITraceService } from '@/application/adaptors/trace.service';

const config = getEnvs({
  AUTH_ADMIN_EMAIL: '',
  AUTH_USER_ID: '',
});

@injectable()
export default class AdminRefreshTokenUseCaseImpl implements IAdminRefreshTokenUseCase {
  public constructor(
    @inject(TYPES.ITokenService) private readonly _tokenService: ITokenService,
    @inject(TYPES.LoggerService)
    private readonly _logger: ILoggerService,
    @inject(TYPES.TraceService)
    private readonly _tracer: ITraceService,
  ) {}

  public async execute(dto: RefreshTokenDto): Promise<IAuthTokens> {
    return await this._tracer.startActiveSpan('AdminRefreshTokenUseCaseImpl.execute', async () => {
      this._logger.debug('Executing AdminRefreshTokenUseCaseImpl for admin refresh');

      let jwtPayload: { userId: string; keyId: string; email?: string; role?: string };
      try {
        jwtPayload = await this._tokenService.verifyRefreshToken<{
          userId: string;
          keyId: string;
          email?: string;
          role?: string;
        }>(dto.refreshToken);
      } catch (err) {
        this._logger.error('Admin refresh token verification failed', { error: err });
        throw new AuthenticationError(
          'The provided token either expired or revoked. Please login again.',
        );
      }

      // Validate userId and role,
      if (
        jwtPayload.userId !== String(config.AUTH_USER_ID) ||
        (jwtPayload.role && jwtPayload.role !== UserRoles.ADMIN)
      ) {
        this._logger.error(
          `JWT refresh attempted for non-admin or mismatched userId (userId: ${jwtPayload.userId}, role: ${jwtPayload.role})`,
        );
        throw new AuthenticationError('Invalid admin credentials in token.');
      }

      // Compose admin token payload - do not trust contents entirely from incoming payload, use configuration if possible.
      const adminPayload = {
        role: UserRoles.ADMIN as string,
        userId: String(config.AUTH_USER_ID),
        username: 'EduLearn-admin',
        roles: ['admin'],
        permissions: [...RolePermissions.admin, ...RolePermissions.instructor],
        email: config.AUTH_ADMIN_EMAIL.toString() || jwtPayload.email || '',
        avatar: '',
        keyId: jwtPayload.keyId,
      };

      // Issue a fresh access token for admin
      const accessToken = this._tokenService.generateAccessToken(adminPayload);

      this._logger.debug(`Successfully refreshed admin tokens for userId: ${adminPayload.userId}`);

      return {
        accessToken,
        refreshToken: dto.refreshToken,
      };
    });
  }
}

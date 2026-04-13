import { inject, injectable } from 'inversify';
import { TYPES } from '@/shared/constants/identifiers';
import ITokenService from '@/application/services/token.service';
import { IAuthTokens } from '@/shared/types/auth.tokens';
import RefreshTokenDto from '@/application/dtos/refresh-token.dto';
import { TracingService } from '@/infrastructure/observability/tracing/trace.service';
import { LoggingService } from '@/infrastructure/observability/logging/logging.service';
import { AuthenticationError } from '@/shared/errors/auth.error';
import { getEnvs } from '@/shared/utils/getEnv';
import { IRefreshTokenUseCase } from '../../adaptors/refresh-token.interface';
import { UserRoles } from '@/domain/entity/user';
import { RolePermissions } from '@/shared/types';

const config = getEnvs({
  AUTH_ADMIN_EMAIL: '',
  AUTH_USER_ID: '',
});

@injectable()
export default class AdminRefreshTokenUseCaseImpl implements IRefreshTokenUseCase {
  public constructor(
    @inject(TYPES.ITokenService) private readonly tokenService: ITokenService,
    @inject(TYPES.TracingService)
    private readonly tracer: TracingService,
    @inject(TYPES.LoggingService)
    private readonly logger: LoggingService,
  ) {}

  public async execute(dto: RefreshTokenDto): Promise<IAuthTokens> {
    return await this.tracer.startActiveSpan('AdminRefreshTokenUseCaseImpl.execute', async () => {
      this.logger.debug('Executing AdminRefreshTokenUseCaseImpl for admin refresh');

      let jwtPayload: { userId: string; keyId: string; email?: string; role?: string };
      try {
        jwtPayload = await this.tokenService.verifyRefreshToken<{
          userId: string;
          keyId: string;
          email?: string;
          role?: string;
        }>(dto.refreshToken);
      } catch (err) {
        this.logger.error('Admin refresh token verification failed', { error: err });
        throw new AuthenticationError(
          'The provided token either expired or revoked. Please login again.',
        );
      }

      // Validate userId and role,
      if (
        jwtPayload.userId !== String(config.AUTH_USER_ID) ||
        (jwtPayload.role && jwtPayload.role !== UserRoles.ADMIN)
      ) {
        this.logger.error(
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
      const accessToken = this.tokenService.generateAccessToken(adminPayload);

      this.logger.debug(`Successfully refreshed admin tokens for userId: ${adminPayload.userId}`);

      return {
        accessToken,
        refreshToken: dto.refreshToken,
      };
    });
  }
}

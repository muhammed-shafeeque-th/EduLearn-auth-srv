import { inject, injectable } from 'inversify';
import { TYPES } from '@/shared/constants/identifiers';
import IUUIDService from '../../services/uuid.service';
import LoginUserDto from '../../dtos/login-user.dto';
import UserNotFoundError from '@/shared/errors/not-found.error';
import BadRequestError from '@/shared/errors/bad-request.error';
import ITokenService from '../../services/token.service';
import { TracingService } from '@/infrastructure/observability/tracing/trace.service';
import { LoggingService } from '@/infrastructure/observability/logging/logging.service';
import { IAuthTokens } from '@/shared/types/auth.tokens';
import { calculateRefreshTokenExpiryInMs } from '@/shared/utils/token-manager';
import { UserRoles } from '@/shared/types/user-types';
import IAdminLoginUseCase from '../../adaptors/admin-login.interface';
import { getEnvs } from '@/shared/utils/getEnv';

const config = getEnvs({
  AUTH_ADMIN_EMAIL: '',
  AUTH_ADMIN_PASSWORD: '',
  AUTH_USER_ID: '',
});

@injectable()
export default class AdminLoginUseCaseImpl implements IAdminLoginUseCase {
  public constructor(
    @inject(TYPES.IUUIDService) private readonly uuidService: IUUIDService,
    @inject(TYPES.ITokenService) private readonly tokenService: ITokenService,
    @inject(TYPES.TracingService)
    private readonly tracer: TracingService,
    @inject(TYPES.LoggingService)
    private readonly logger: LoggingService,
  ) {}

  public async execute(dto: LoginUserDto): Promise<IAuthTokens> {
    return await this.tracer.startActiveSpan('AdminLoginUseCaseImpl.execute', async (span) => {
      span.setAttributes({ email: dto.email });
      this.logger.debug(`Executing AdminLoginUseCaseImpl for user with email: ${dto.email}`);

      // Check whether user exists with provided email
      if (dto.email !== config.AUTH_ADMIN_EMAIL) {
        this.logger.warn(`User not found with email ${dto.email}`);
        throw new UserNotFoundError(
          'user not found with provided email, please check your email and try again',
        );
      }

      // Validate password (for admin login, use constant env password)
      const isPasswordValid = config.AUTH_ADMIN_PASSWORD === dto.password;

      if (!isPasswordValid) {
        this.logger.warn('Admin password does not match configured admin password.');
        throw new BadRequestError('Invalid password. Please try again.');
      }

      const tokenId = this.uuidService.generate();

      const tokenPayload = {
        email: dto.email,
        role: UserRoles.ADMIN as string,
        userId: String(config.AUTH_USER_ID),
        username: 'EduLearn-admin',
      };

      const accessToken = this.tokenService.generateAccessToken({
        ...tokenPayload,
        expiry: calculateRefreshTokenExpiryInMs(true) / 1000,
      });
      const refreshToken = this.tokenService.generateRefreshToken({
        ...tokenPayload,
        keyId: tokenId,
        expiry: calculateRefreshTokenExpiryInMs(true) / 1000,
      });

      this.logger.debug(
        'Successfully completed the login use-case process for user with email: ' + dto.email,
      );

      return { accessToken, refreshToken };
    });
  }
}

import { inject, injectable } from 'inversify';
import { TYPES } from '@/shared/constants/identifiers';
import IHashService from '../services/hash.service';
import IUserRepository from '@/domain/repository/user.repository';
import IUUIDService from '../services/uuid.service';
import ILoginUserUseCase from '../adaptors/login-user.interface';
import LoginUserDto from '../dtos/login-user.dto';
import UserNotFoundError from '@/shared/errors/not-found.error';
import BadRequestError from '@/shared/errors/bad-request.error';
import { IRefreshTokenRepository } from '@/domain/repository/refresh-token.repository';
import ITokenService from '../services/token.service';
// import { RefreshToken } from '@/domain/entity/refresh-token';
import { TracingService } from '@/infrastructure/observability/tracing/trace.service';
import { LoggingService } from '@/infrastructure/observability/logging/logging.service';
import { IAuthTokens } from '@/shared/types/auth.tokens';
import { calculateRefreshTokenExpiryInMs, mapUserToToken } from '@/shared/utils/token-manager';
import { ForbiddenError } from '@/domain/errors/forbidden.error';

@injectable()
export default class LoginUserUseCaseImpl implements ILoginUserUseCase {
  public constructor(
    @inject(TYPES.IHashService) private readonly hashService: IHashService,
    @inject(TYPES.IUserRepository) private readonly userRepository: IUserRepository,
    @inject(TYPES.IUUIDService) private readonly uuidService: IUUIDService,
    @inject(TYPES.ITokenService) private readonly tokenService: ITokenService,
    @inject(TYPES.IRefreshTokenRepository)
    private readonly tokenRepository: IRefreshTokenRepository,
    @inject(TYPES.TracingService)
    private readonly tracer: TracingService,
    @inject(TYPES.LoggingService)
    private readonly logger: LoggingService,
  ) {}
  public async execute(dto: LoginUserDto): Promise<IAuthTokens> {
    return await this.tracer.startActiveSpan('LoginUserUseCase.execute', async (span) => {
      span.setAttributes({
        email: dto.email,
      });

      this.logger.debug(`Executing LoginUserUseCase for user with email: ${dto.email}`);

      const user = await this.userRepository.findByEmail(dto.email);

      if (!user) {
        this.logger.warn(`User not found with email ${dto.email}`);
        throw new UserNotFoundError(
          'user not found with provided email, please check your email and try again',
        );
      }

      if (user.isBlocked()) {
        this.logger.warn(`Blocked user attempted login: ${dto.email}`);
        throw new ForbiddenError('Your account is blocked. Please contact support for assistance.');
      }

      if (!user.getPassword() && !user.isEmailAuth()) {
        throw new BadRequestError(
          'Invalid login method. Please use the correct login method associated with your account.',
        );
      }

      const passwordMatch = await this.hashService.compare(user.getPassword()!, dto.password);

      if (!passwordMatch) {
        this.logger.warn(`Given password is mismatch with email ${dto.email}`);
        throw new BadRequestError(
          'Invalid credentials. Please check your credentials and try again.',
        );
      }
      const tokenId = this.uuidService.generate();

      const accessToken = this.tokenService.generateAccessToken(mapUserToToken(user, tokenId));

      const refreshToken = this.tokenService.generateRefreshToken(
        mapUserToToken(
          user,
          tokenId,

          calculateRefreshTokenExpiryInMs(dto.rememberMe) / 1000,
        ),
      );

      user.login();

      await Promise.all([
        this.userRepository.update(user.getId(), user),

        // this.tokenRepository.upsertToken(token),
      ]);
      this.logger.debug(
        'Successfully completed the login use-case process for user with email: ' + dto.email,
      );

      return { accessToken, refreshToken };
    });
  }
}

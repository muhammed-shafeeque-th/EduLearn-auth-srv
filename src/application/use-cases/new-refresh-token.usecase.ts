import { inject, injectable } from 'inversify';
import { TYPES } from '@/shared/constants/identifiers';
import IHashService from '@/application/services/hash.service';
import IUserRepository from '@/domain/repository/user.repository';
import IUUIDService from '@/application/services/uuid.service';
import ITokenService from '@/application/services/token.service';
import { IRefreshTokenRepository } from '@/domain/repository/refresh-token.repository';
import { IAuthTokens } from '@/shared/types/auth.tokens';
import RefreshTokenDto from '@/application/dtos/new-refresh-token.dto';

import { TracingService } from '@/infrastructure/observability/tracing/trace.service';
import { LoggingService } from '@/infrastructure/observability/logging/logging.service';
import { AuthenticationError } from '@/shared/errors/auth.error';
import { mapUserToToken } from '@/shared/utils/token-manager';
import { ForbiddenError } from '@/shared/errors/forbidden.error';
import { IRefreshTokenUseCase } from '../adaptors/new-refresh-token.interface';

@injectable()
export default class RefreshTokenUseCaseImpl implements IRefreshTokenUseCase {
  public constructor(
    @inject(TYPES.IRegisterUserUseCase) private readonly hashService: IHashService,
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
  public async execute(dto: RefreshTokenDto): Promise<IAuthTokens> {
    return await this.tracer.startActiveSpan('RefreshTokenUseCaseImpl.execute', async () => {
      this.logger.debug(`Executing RefreshToken use-case`);

      const jwtPayload = await this.tokenService.verifyRefreshToken<{
        userId: string;
        keyId: string;
      }>(dto.refreshToken);

      const user = await this.userRepository.findById(jwtPayload.userId);

      if (!user) {
        this.logger.error('The provided token either expired or revoked');
        throw new AuthenticationError(
          'The provided token either expired or revoked. Please login  again.',
        );
      }
      if (user.isBlocked()) {
        this.logger.warn(`Blocked user attempted login: ${user.getEmail()}`);
        throw new ForbiddenError('Your account is blocked. Please contact support for assistance.');
      }

      // const tokenWithUser = await this.tokenRepository.findUserByToken(dto.refreshToken);

      // if (!tokenWithUser) {
      //   this.logger.error('The provided token either expired or revoked');
      //   throw new AuthenticationError(
      //     'The provided token either expired or revoked. Please login  again.',
      //   );
      // }
      // const { user } = tokenWithUser;

      // Generate access token with user data
      const accessToken = this.tokenService.generateAccessToken(
        mapUserToToken(user, jwtPayload.keyId),
      );

      // // Generate refresh token with user data
      // const refreshToken = this.tokenService.generateRefreshToken(
      //   mapUserToToken(user, tokenWithUser.id),
      // );

      // // hash refresh token to better security (a good practice)
      // const hashedToken = await this.hashService.hash(refreshToken);

      // const token = new RefreshToken(
      //   tokenWithUser.id,
      //   tokenWithUser.userId,
      //   hashedToken,
      //   tokenWithUser.expiresAt,
      //   tokenWithUser.isRememberMe,
      // );

      // // Create a token if token not exist with current userId else update.
      // await this.tokenRepository.upsertToken(token);

      this.logger.debug(
        'Successfully completed the refresh token use-case process for user ' + user.getId(),
      );

      return { accessToken, refreshToken: dto.refreshToken };
    });
  }
}

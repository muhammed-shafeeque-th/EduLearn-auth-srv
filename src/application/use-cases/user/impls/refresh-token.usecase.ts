import { inject, injectable } from 'inversify';
import { TYPES } from '@/shared/constants/identifiers';
import IHashService from '@/application/adaptors/hash.service';
import IUserRepository from '@/domain/repository/user.repository';
import IUUIDService from '@/application/adaptors/uuid.service';
import ITokenService from '@/application/adaptors/token.service';
import { IRefreshTokenRepository } from '@/domain/repository/refresh-token.repository';
import { IAuthTokens } from '@/shared/types/auth.tokens';
import RefreshTokenDto from '@/application/dtos/refresh-token.dto';

import { AuthenticationError } from '@/shared/errors/auth.error';
import { mapUserToToken } from '@/shared/utils/token-manager';
import { ForbiddenError } from '@/domain/errors/forbidden.error';
import { IRefreshTokenUseCase } from '../interfaces/refresh-token.interface';
import { ILoggerService } from '../../../adaptors/logger.service';
import { ITraceService } from '../../../adaptors/trace.service';

@injectable()
export default class RefreshTokenUseCaseImpl implements IRefreshTokenUseCase {
  public constructor(
    @inject(TYPES.IRegisterUserUseCase) private readonly _hashService: IHashService,
    @inject(TYPES.IUserRepository) private readonly _userRepository: IUserRepository,
    @inject(TYPES.IUUIDService) private readonly _uuidService: IUUIDService,
    @inject(TYPES.ITokenService) private readonly _tokenService: ITokenService,
    @inject(TYPES.IRefreshTokenRepository)
    private readonly _tokenRepository: IRefreshTokenRepository,
    @inject(TYPES.LoggerService)
    private readonly _logger: ILoggerService,
    @inject(TYPES.TraceService)
    private readonly _tracer: ITraceService,
  ) {}
  public async execute(dto: RefreshTokenDto): Promise<IAuthTokens> {
    return await this._tracer.startActiveSpan('RefreshTokenUseCaseImpl.execute', async () => {
      this._logger.debug(`Executing RefreshToken use-case`);

      const jwtPayload = await this._tokenService.verifyRefreshToken<{
        userId: string;
        keyId: string;
      }>(dto.refreshToken);

      const user = await this._userRepository.findById(jwtPayload.userId);

      if (!user) {
        this._logger.error('The provided token either expired or revoked');
        throw new AuthenticationError(
          'The provided token either expired or revoked. Please login  again.',
        );
      }
      if (user.isBlocked()) {
        this._logger.warn(`Blocked user attempted login: ${user.getEmail()}`);
        throw new ForbiddenError('Your account is blocked. Please contact support for assistance.');
      }

      // const tokenWithUser = await this._tokenRepository.findUserByToken(dto.refreshToken);

      // if (!tokenWithUser) {
      //   this._logger.error('The provided token either expired or revoked');
      //   throw new AuthenticationError(
      //     'The provided token either expired or revoked. Please login  again.',
      //   );
      // }
      // const { user } = tokenWithUser;

      // Generate access token with user data
      const accessToken = this._tokenService.generateAccessToken(
        mapUserToToken(user, jwtPayload.keyId),
      );

      // // Generate refresh token with user data
      // const refreshToken = this._tokenService.generateRefreshToken(
      //   mapUserToToken(user, tokenWithUser.id),
      // );

      // // hash refresh token to better security (a good practice)
      // const hashedToken = await this._hashService.hash(refreshToken);

      // const token = new RefreshToken(
      //   tokenWithUser.id,
      //   tokenWithUser.userId,
      //   hashedToken,
      //   tokenWithUser.expiresAt,
      //   tokenWithUser.isRememberMe,
      // );

      // // Create a token if token not exist with current userId else update.
      // await this._tokenRepository.upsertToken(token);

      this._logger.debug(
        'Successfully completed the refresh token use-case process for user ' + user.getId(),
      );

      return { accessToken, refreshToken: dto.refreshToken };
    });
  }
}

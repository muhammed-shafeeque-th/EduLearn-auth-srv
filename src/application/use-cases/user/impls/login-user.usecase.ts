import { inject, injectable } from 'inversify';
import { TYPES } from '@/shared/constants/identifiers';
import IHashService from '../../../adaptors/hash.service';
import IUserRepository from '@/domain/repository/user.repository';
import IUUIDService from '../../../adaptors/uuid.service';
import ILoginUserUseCase from '../interfaces/login-user.interface';
import LoginUserDto from '../../../dtos/login-user.dto';
import UserNotFoundError from '@/shared/errors/not-found.error';
import BadRequestError from '@/shared/errors/bad-request.error';
import { IRefreshTokenRepository } from '@/domain/repository/refresh-token.repository';
import ITokenService from '../../../adaptors/token.service';
// import { RefreshToken } from '@/domain/entity/refresh-token';
import { IAuthTokens } from '@/shared/types/auth.tokens';
import { calculateRefreshTokenExpiryInMs, mapUserToToken } from '@/shared/utils/token-manager';
import { ForbiddenError } from '@/domain/errors/forbidden.error';
import { ITraceService } from '../../../adaptors/trace.service';
import { LoggerService } from '@/infrastructure/observability/logger/logger.service';

@injectable()
export default class LoginUserUseCaseImpl implements ILoginUserUseCase {
  public constructor(
    @inject(TYPES.IHashService) private readonly _hashService: IHashService,
    @inject(TYPES.IUserRepository) private readonly _userRepository: IUserRepository,
    @inject(TYPES.IUUIDService) private readonly _uuidService: IUUIDService,
    @inject(TYPES.ITokenService) private readonly _tokenService: ITokenService,
    @inject(TYPES.IRefreshTokenRepository)
    private readonly _tokenRepository: IRefreshTokenRepository,
    @inject(TYPES.TraceService)
    private readonly _tracer: ITraceService,
    @inject(TYPES.LoggerService)
    private readonly _logger: LoggerService,
  ) {}
  public async execute(dto: LoginUserDto): Promise<IAuthTokens> {
    return await this._tracer.startActiveSpan('LoginUserUseCase.execute', async (span) => {
      span.setAttributes({
        email: dto.email,
      });

      this._logger.debug(`Executing LoginUserUseCase for user with email: ${dto.email}`);

      const user = await this._userRepository.findByEmail(dto.email);

      if (!user) {
        this._logger.warn(`User not found with email ${dto.email}`);
        throw new UserNotFoundError(
          'user not found with provided email, please check your email and try again',
        );
      }

      if (user.isBlocked()) {
        this._logger.warn(`Blocked user attempted login: ${dto.email}`);
        throw new ForbiddenError('Your account is blocked. Please contact support for assistance.');
      }

      if (!user.getPassword() && !user.isEmailAuth()) {
        throw new BadRequestError(
          'Invalid login method. Please use the correct login method associated with your account.',
        );
      }

      const passwordMatch = await this._hashService.compare(user.getPassword()!, dto.password);

      if (!passwordMatch) {
        this._logger.warn(`Given password is mismatch with email ${dto.email}`);
        throw new BadRequestError(
          'Invalid credentials. Please check your credentials and try again.',
        );
      }
      const tokenId = this._uuidService.generate();

      const accessToken = this._tokenService.generateAccessToken(mapUserToToken(user, tokenId));

      const refreshToken = this._tokenService.generateRefreshToken(
        mapUserToToken(
          user,
          tokenId,

          calculateRefreshTokenExpiryInMs(dto.rememberMe) / 1000,
        ),
      );

      user.login();

      await Promise.all([
        this._userRepository.update(user.getId(), user),

        // this._tokenRepository.upsertToken(token),
      ]);
      this._logger.debug(
        'Successfully completed the login use-case process for user with email: ' + dto.email,
      );

      return { accessToken, refreshToken };
    });
  }
}

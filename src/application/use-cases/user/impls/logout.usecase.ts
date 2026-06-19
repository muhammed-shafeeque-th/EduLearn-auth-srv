import { inject, injectable } from 'inversify';
import { TYPES } from '@/shared/constants/identifiers';
import LogoutUserDto from '@/application/dtos/logout.dto';
import UserNotFoundError from '@/shared/errors/not-found.error';
import IUserRepository from '@/domain/repository/user.repository';
import ILogoutUserUseCase from '@/application/use-cases/user/interfaces/logout.interface';
import { IRefreshTokenRepository } from '@/domain/repository/refresh-token.repository';
import { ILoggerService } from '../../../adaptors/logger.service';
import { ITraceService } from '../../../adaptors/trace.service';
// import { AuthType } from '@/shared/types/user-types';

@injectable()
export default class LogoutUserUseCaseImpl implements ILogoutUserUseCase {
  public constructor(
    @inject(TYPES.IUserRepository) private readonly _userRepository: IUserRepository,
    @inject(TYPES.IRefreshTokenRepository)
    private readonly _tokenRepository: IRefreshTokenRepository,
    @inject(TYPES.LoggerService)
    private readonly _logger: ILoggerService,
    @inject(TYPES.TraceService)
    private readonly _tracer: ITraceService,
  ) {}
  public async execute(dto: LogoutUserDto): Promise<{ userId: string }> {
    return await this._tracer.startActiveSpan('LogoutUserUseCaseImpl.execute', async (span) => {
      span.setAttributes({
        'user.id': dto.userId,
      });

      this._logger.debug(`Executing Logout for user  ${dto.userId}`);
      // Checks whether user exist with provided email
      const user = await this._userRepository.findById(dto.userId);

      if (!user) {
        this._logger.error(`user not found with Id ${dto.userId}`);
        throw new UserNotFoundError('user not found with provided userId');
      }

      // Mark user status as not active
      user.deactivate();

      await this._userRepository.update(user.getId(), user);
      // await this._tokenRepository.updateToken(user.getId(), user);

      this._logger.debug('Successfully completed the logout process for user ' + dto.userId);
      return { userId: user.getId() };
    });
  }
}

import { inject, injectable } from 'inversify';
import { TYPES } from '@/shared/constants/identifiers';
import IAuthUserRepository from '@/domain/repository/user.repository';
import UserNotFoundError from '@/domain/errors/user-not-found.error';
import { IAccountUnblockedUseCase } from '../interfaces/unblock-account.interface';
import AccountUnblockedDto from '../../../dtos/instructor-unblocked.event-dto';
import { UserRoles, UserStatus } from '@/domain/entity/user';
import { ILoggerService } from '../../../adaptors/logger.service';
import { ITraceService } from '../../../adaptors/trace.service';

@injectable()
export default class AccountUnblockedUseCaseImpl implements IAccountUnblockedUseCase {
  public constructor(
    @inject(TYPES.IUserRepository)
    private readonly _userRepository: IAuthUserRepository,
    @inject(TYPES.LoggerService)
    private readonly _logger: ILoggerService,
    @inject(TYPES.TraceService)
    private readonly _tracer: ITraceService,
  ) {}

  public async execute(dto: AccountUnblockedDto): Promise<void> {
    return this._tracer.startActiveSpan('AccountUnblockedUseCaseImpl.execute', async (span) => {
      const { userId } = dto.payload;
      span.setAttributes({ userId: userId });

      this._logger.debug(`Executing UserUnblockedUseCase for user: ${userId}`);
      const user = await this._userRepository.findById(userId);

      if (!user) {
        this._logger.warn(`User not found while attempting to unblock: ${userId}`);
        throw new UserNotFoundError(userId);
      }

      if (dto.payload.roles || dto.payload.roleStatus || dto.payload.status) {
        user.syncRolesAndStatus({
          roles: dto.payload.roles as UserRoles[],
          roleStatus: dto.payload.roleStatus!,
          status: dto.payload.status as UserStatus,
        });
      } else {
        user.unblock();
      }

      await this._userRepository.update(userId, user);

      this._logger.debug(`User successfully unblocked: ${userId}`);
    });
  }
}

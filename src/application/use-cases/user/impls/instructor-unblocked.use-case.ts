import { inject, injectable } from 'inversify';
import { TYPES } from '@/shared/constants/identifiers';
import IAuthUserRepository from '@/domain/repository/user.repository';
import UserNotFoundError from '@/domain/errors/user-not-found.error';
import { IInstructorUnBlockedUseCase } from '../interfaces/instructor-unblocked.interface';
import InstructorUnblockedDto from '@/application/dtos/instructor-unblocked.event-dto';
import { UserRoles, UserStatus } from '@/domain/entity/user';
import { ILoggerService } from '@/application/adaptors/logger.service';
import { ITraceService } from '@/application/adaptors/trace.service';

@injectable()
export default class InstructorUnblockedUseCaseImpl implements IInstructorUnBlockedUseCase {
  public constructor(
    @inject(TYPES.IUserRepository)
    private readonly _userRepository: IAuthUserRepository,
    @inject(TYPES.LoggerService)
    private readonly _logger: ILoggerService,
    @inject(TYPES.TraceService)
    private readonly _tracer: ITraceService,
  ) {}

  public async execute(dto: InstructorUnblockedDto): Promise<void> {
    return this._tracer.startActiveSpan('InstructorUnblockedUseCaseImpl.execute', async (span) => {
      const { userId } = dto.payload;
      span.setAttributes({ userId: userId });

      this._logger.debug(`Executing InstructorUnblockedUseCaseImpl for user: ${userId}`);
      const user = await this._userRepository.findById(userId);

      if (!user) {
        this._logger.warn(`instructor not found while attempting to unblock: ${userId}`);
        throw new UserNotFoundError(userId);
      }

      if (!user.isRoleBlocked(UserRoles.INSTRUCTOR)) {
        this._logger.warn(`instructor not blocked while attempting to unblock: ${userId}`);
        return;
      }

      if (dto.payload.roles || dto.payload.roleStatus || dto.payload.status) {
        user.syncRolesAndStatus({
          roles: dto.payload.roles as UserRoles[],
          roleStatus: dto.payload.roleStatus!,
          status: dto.payload.status as UserStatus,
        });
      }
      user.unblockRole(UserRoles.INSTRUCTOR);

      await this._userRepository.update(userId, user);

      this._logger.debug(`User successfully unblocked: ${userId}`);
    });
  }
}

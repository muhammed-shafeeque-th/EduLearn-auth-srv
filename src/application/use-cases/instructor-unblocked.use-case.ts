import { inject, injectable } from 'inversify';
import { TYPES } from '@/shared/constants/identifiers';
import IAuthUserRepository from '@/domain/repository/user.repository';
import { LoggingService } from '@/infrastructure/observability/logging/logging.service';
import { TracingService } from '@/infrastructure/observability/tracing/trace.service';
import UserNotFoundError from '@/domain/errors/user-not-found.error';
import { IInstructorUnBlockedUseCase } from '../adaptors/instructor-unblocked.interface';
import InstructorUnblockedDto from '../dtos/instructor-unblocked.event-dto';
import { UserRoles, UserStatus } from '@/domain/entity/user';

@injectable()
export default class InstructorUnblockedUseCaseImpl implements IInstructorUnBlockedUseCase {
  public constructor(
    @inject(TYPES.IUserRepository)
    private readonly userRepository: IAuthUserRepository,
    @inject(TYPES.LoggingService)
    private readonly logger: LoggingService,
    @inject(TYPES.TracingService)
    private readonly tracer: TracingService,
  ) {}

  public async execute(dto: InstructorUnblockedDto): Promise<void> {
    return this.tracer.startActiveSpan('InstructorUnblockedUseCaseImpl.execute', async (span) => {
      const { userId } = dto.payload;
      span.setAttributes({ userId: userId });

      this.logger.debug(`Executing InstructorUnblockedUseCaseImpl for user: ${userId}`);
      const user = await this.userRepository.findById(userId);

      if (!user) {
        this.logger.warn(`instructor not found while attempting to unblock: ${userId}`);
        throw new UserNotFoundError(userId);
      }

      if (!user.isRoleBlocked(UserRoles.INSTRUCTOR)) {
        this.logger.warn(`instructor not blocked while attempting to unblock: ${userId}`);
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

      await this.userRepository.update(userId, user);

      this.logger.debug(`User successfully unblocked: ${userId}`);
    });
  }
}

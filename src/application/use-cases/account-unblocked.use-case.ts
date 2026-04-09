import { inject, injectable } from 'inversify';
import { TYPES } from '@/shared/constants/identifiers';
import IAuthUserRepository from '@/domain/repository/user.repository';
import { LoggingService } from '@/infrastructure/observability/logging/logging.service';
import { TracingService } from '@/infrastructure/observability/tracing/trace.service';
import UserNotFoundError from '@/domain/errors/user-not-found.error';
import { IAccountUnblockedUseCase } from '../adaptors/unblock-account.interface';
import AccountUnblockedDto from '../dtos/instructor-unblocked.event-dto';
import { UserRoles, UserStatus } from '@/domain/entity/user';

@injectable()
export default class AccountUnblockedUseCaseImpl implements IAccountUnblockedUseCase {
  public constructor(
    @inject(TYPES.IUserRepository)
    private readonly userRepository: IAuthUserRepository,
    @inject(TYPES.LoggingService)
    private readonly logger: LoggingService,
    @inject(TYPES.TracingService)
    private readonly tracer: TracingService,
  ) {}

  public async execute(dto: AccountUnblockedDto): Promise<void> {
    return this.tracer.startActiveSpan('AccountUnblockedUseCaseImpl.execute', async (span) => {
      const { userId } = dto.payload;
      span.setAttributes({ userId: userId });

      this.logger.debug(`Executing UserUnblockedUseCase for user: ${userId}`);
      const user = await this.userRepository.findById(userId);

      if (!user) {
        this.logger.warn(`User not found while attempting to unblock: ${userId}`);
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

      await this.userRepository.update(userId, user);

      this.logger.debug(`User successfully unblocked: ${userId}`);
    });
  }
}

import { inject, injectable } from 'inversify';
import { TYPES } from '@/shared/constants/identifiers';
import IAuthUserRepository from '@/domain/repository/user.repository';
import IEventPublisher from '../services/event-publisher.service';
import { LoggingService } from '@/infrastructure/observability/logging/logging.service';
import { TracingService } from '@/infrastructure/observability/tracing/trace.service';
import UserNotFoundError from '@/domain/errors/user-not-found.error';
import { IAccountBlockedUseCase } from '../adaptors/block-account.interface';
import AccountBlockedDto from '../dtos/account-blocked.event-dto';
import { UserRoles, UserStatus } from '@/domain/entity/user';

@injectable()
export default class AccountBlockedUseCaseImpl implements IAccountBlockedUseCase {
  public constructor(
    @inject(TYPES.IUserRepository)
    private readonly userRepository: IAuthUserRepository,
    @inject(TYPES.IEventPublisherService)
    private readonly eventPublisher: IEventPublisher,
    @inject(TYPES.LoggingService)
    private readonly logger: LoggingService,
    @inject(TYPES.TracingService)
    private readonly tracer: TracingService,
  ) {}

  public async execute(dto: AccountBlockedDto): Promise<void> {
    return this.tracer.startActiveSpan('AccountBlockedUseCaseImpl.execute', async (span) => {
      const { userId } = dto.payload;

      span.setAttributes({ userId: userId });

      this.logger.debug(`Executing UserBlockedUseCase for user: ${userId}`);
      const user = await this.userRepository.findById(userId);

      if (!user) {
        this.logger.warn(`User not found while attempting to block: ${userId}`);
        throw new UserNotFoundError(userId);
      }

      // Apply business logic for blocking user
      if (dto.payload.roles || dto.payload.roleStatus || dto.payload.status) {
        user.syncRolesAndStatus({
          roles: dto.payload.roles as UserRoles[],
          roleStatus: dto.payload.roleStatus as any,
          status: dto.payload.status as UserStatus,
        });
      } else {
        user.block();
      }

      await this.userRepository.update(userId, user);

      this.logger.debug(`User successfully blocked: ${userId}`);
    });
  }
}

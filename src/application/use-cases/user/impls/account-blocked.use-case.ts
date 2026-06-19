import { inject, injectable } from 'inversify';
import { TYPES } from '@/shared/constants/identifiers';
import IAuthUserRepository from '@/domain/repository/user.repository';
import IEventPublisher from '../../../adaptors/event-publisher.service';
import UserNotFoundError from '@/domain/errors/user-not-found.error';
import { IAccountBlockedUseCase } from '../interfaces/block-account.interface';
import AccountBlockedDto from '../../../dtos/account-blocked.event-dto';
import { UserRoles, UserStatus } from '@/domain/entity/user';
import { ILoggerService } from '../../../adaptors/logger.service';
import { ITraceService } from '../../../adaptors/trace.service';

@injectable()
export default class AccountBlockedUseCaseImpl implements IAccountBlockedUseCase {
  public constructor(
    @inject(TYPES.IUserRepository)
    private readonly _userRepository: IAuthUserRepository,
    @inject(TYPES.IEventPublisherService)
    private readonly _eventPublisher: IEventPublisher,
    @inject(TYPES.LoggerService)
    private readonly _logger: ILoggerService,
    @inject(TYPES.TraceService)
    private readonly _tracer: ITraceService,
  ) {}

  public async execute(dto: AccountBlockedDto): Promise<void> {
    return this._tracer.startActiveSpan('AccountBlockedUseCaseImpl.execute', async (span) => {
      const { userId } = dto.payload;

      span.setAttributes({ userId: userId });

      this._logger.debug(`Executing UserBlockedUseCase for user: ${userId}`);
      const user = await this._userRepository.findById(userId);

      if (!user) {
        this._logger.warn(`User not found while attempting to block: ${userId}`);
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

      await this._userRepository.update(userId, user);

      this._logger.debug(`User successfully blocked: ${userId}`);
    });
  }
}

import { inject, injectable } from 'inversify';
import { TYPES } from '@/shared/constants/identifiers';
import IAuthUserRepository from '@/domain/repository/user.repository';
import IEventPublisher from '../services/event-publisher.service';
import { LoggingService } from '@/infrastructure/observability/logging/logging.service';
import { TracingService } from '@/infrastructure/observability/tracing/trace.service';
import UserNotFoundError from '@/domain/errors/user-not-found.error';
import { IInstructorBlockedUseCase } from '../adaptors/instructor-blocked.interface';
import InstructorBlockedDto from '../dtos/instructor-blocked.event-dto';
import { UserRoles, UserStatus } from '@/domain/entity/user';

@injectable()
export default class InstructorBlockedUseCaseImpl implements IInstructorBlockedUseCase {
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

  public async execute(dto: InstructorBlockedDto): Promise<void> {
    return this.tracer.startActiveSpan('InstructorBlockedUseCaseImpl.execute', async (span) => {
      const { userId } = dto.payload;

      span.setAttributes({ userId: userId });

      this.logger.debug(`Executing InstructorBlockedUseCaseImpl for user: ${userId}`);
      const user = await this.userRepository.findById(userId);

      if (!user) {
        this.logger.warn(`User not found while attempting to block: ${userId}`);
        throw new UserNotFoundError(userId);
      }

      if (user.isRoleBlocked(UserRoles.INSTRUCTOR)) {
        this.logger.warn('user instructor role already in blocked state');
        return;
      }

      // Apply business logic for blocking user
      if (dto.payload.roles || dto.payload.roleStatus || dto.payload.status) {
        user.syncRolesAndStatus({
          roles: dto.payload.roles as UserRoles[],
          roleStatus: dto.payload.roleStatus as any,
          status: dto.payload.status as UserStatus,
        });
      }

      user.blockRole(UserRoles.INSTRUCTOR);

      await this.userRepository.update(userId, user);

      this.logger.debug(`Instructor successfully blocked: ${userId}`);
    });
  }
}

import { inject, injectable } from 'inversify';
import { TYPES } from '@/shared/constants/identifiers';
import IAuthUserRepository from '@/domain/repository/user.repository';
import IEventPublisher from '../services/event-publisher.service';
import { LoggingService } from '@/infrastructure/observability/logging/logging.service';
import { TracingService } from '@/infrastructure/observability/tracing/trace.service';
import UserNotFoundError from '@/shared/errors/user-not-found.error';
import { IUserBlockedUseCase } from '../adaptors/block-user.interface';
import UserBlockedDto from '../dtos/user-blocked.dto';

@injectable()
export default class UserBlockedUseCaseImpl implements IUserBlockedUseCase {
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

  public async execute(dto: UserBlockedDto): Promise<void> {
    return this.tracer.startActiveSpan('UserBlockedUseCaseImpl.execute', async (span) => {
      span.setAttributes({ userId: dto.userId });

      this.logger.debug(`Executing UserBlockedUseCase for user: ${dto.userId}`);
      const user = await this.userRepository.findById(dto.userId);

      if (!user) {
        this.logger.warn(`User not found while attempting to block: ${dto.userId}`);
        throw new UserNotFoundError(dto.userId);
      }

      // Apply business logic for blocking user
      user.block();

      await this.userRepository.update(dto.userId, user);

      this.logger.info(`User successfully blocked: ${dto.userId}`);
    });
  }
}

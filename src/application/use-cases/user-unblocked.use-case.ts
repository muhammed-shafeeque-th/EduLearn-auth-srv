import { inject, injectable } from 'inversify';
import { TYPES } from '@/shared/constants/identifiers';
import IAuthUserRepository from '@/domain/repository/user.repository';
import { LoggingService } from '@/infrastructure/observability/logging/logging.service';
import { TracingService } from '@/infrastructure/observability/tracing/trace.service';
import UserNotFoundError from '@/shared/errors/user-not-found.error';
import { IUserUnblockedUseCase } from '../adaptors/unblock-user.interface';
import UserUnblockedDto from '../dtos/unblock-user.dto';

@injectable()
export default class UserUnblockedUseCaseImpl implements IUserUnblockedUseCase {
  public constructor(
    @inject(TYPES.IUserRepository)
    private readonly userRepository: IAuthUserRepository,
    @inject(TYPES.LoggingService)
    private readonly logger: LoggingService,
    @inject(TYPES.TracingService)
    private readonly tracer: TracingService,
  ) {}

  public async execute(dto: UserUnblockedDto): Promise<void> {
    return this.tracer.startActiveSpan('UserUnblockedUseCaseImpl.execute', async (span) => {
      span.setAttributes({ userId: dto.userId });

      this.logger.debug(`Executing UserUnblockedUseCase for user: ${dto.userId}`);
      const user = await this.userRepository.findById(dto.userId);

      if (!user) {
        this.logger.warn(`User not found while attempting to unblock: ${dto.userId}`);
        throw new UserNotFoundError(dto.userId);
      }

      user.unblock();

      await this.userRepository.update(dto.userId, user);

      this.logger.info(`User successfully unblocked: ${dto.userId}`);
    });
  }
}

import IAuthUserRepository from '@/domain/repository/user.repository';
import { inject, injectable } from 'inversify';
import IEventPublisher from '../services/event-publisher.service';
import { LoggingService } from '@/infrastructure/observability/logging/logging.service';
import { TracingService } from '@/infrastructure/observability/tracing/trace.service';
import UserUpdateDto from '../dtos/user-update.event-dto';
import UserNotFoundError from '@/domain/errors/user-not-found.error';
import IUpdateUserUseCase from '../adaptors/update-user.interface';
import { TYPES } from '@/shared/constants/identifiers';

@injectable()
export default class UpdateUserUseCaseImpl implements IUpdateUserUseCase {
  public constructor(
    @inject(TYPES.IUserRepository) private readonly userRepository: IAuthUserRepository,
    @inject(TYPES.IEventPublisherService) private readonly kafkaProducer: IEventPublisher,
    @inject(TYPES.LoggingService) private readonly logger: LoggingService,
    @inject(TYPES.TracingService) private readonly tracer: TracingService,
  ) {}
  public async execute(dto: UserUpdateDto): Promise<void> {
    return this.tracer.startActiveSpan('UpdateUserUseCaseImpl.execute', async (span) => {
      const { userId } = dto.payload;

      span.setAttributes({
        userId: userId,
      });

      this.logger.debug(`Executing UpdateUserUseCaseImpl for user : ${userId}`);
      // Checks whether user exist with provided userId
      const user = await this.userRepository.findById(userId);

      // Throws an error if user NOT exist with given userId
      if (!user) throw new UserNotFoundError(userId);

      user.updateProfile(dto.payload);

      await this.userRepository.update(userId, user);

      this.logger.debug(`Details updated for user ${userId}`);
    });
  }
}

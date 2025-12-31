import IAuthUserRepository from '@/domain/repository/user.repository';
import { inject, injectable } from 'inversify';
import IEventPublisher from '../services/event-publisher.service';
import { LoggingService } from '@/infrastructure/observability/logging/logging.service';
import { TracingService } from '@/infrastructure/observability/tracing/trace.service';
import UserUpdateDto from '../dtos/user-update.dto';
import UserNotFoundError from '@/shared/errors/user-not-found.error';
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
      span.setAttributes({
        userId: dto.userId,
      });

      this.logger.debug(`Executing UpdateUserUseCaseImpl for user : ${dto.userId}`);
      // Checks whether user exist with provided userId
      const user = await this.userRepository.findById(dto.userId);

      // Throws an error if user NOT exist with given userId
      if (!user) throw new UserNotFoundError(dto.userId);

      user.updateProfile(dto);

      // Copy all enumerable properties from dto into user, override existing properties if any
      // Object.assign(user, tempUser);

      await this.userRepository.update(dto.userId, user);

      this.logger.debug(`Details updated for user ${dto.userId}`);
    });
  }
}

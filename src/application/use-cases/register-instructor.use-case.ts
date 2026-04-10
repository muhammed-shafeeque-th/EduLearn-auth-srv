import IAuthUserRepository from '@/domain/repository/user.repository';
import { inject, injectable } from 'inversify';
import IEventPublisher from '../services/event-publisher.service';
import { LoggingService } from '@/infrastructure/observability/logging/logging.service';
import { TracingService } from '@/infrastructure/observability/tracing/trace.service';
import UserNotFoundError from '@/domain/errors/user-not-found.error';
import { TYPES } from '@/shared/constants/identifiers';
import IRegisterInstructorUseCase from '../adaptors/register-instructor.interface';
import RegisterInstructorEventDto from '../dtos/register-instructor-event.dto';

@injectable()
export default class RegisteredInstructorUseCaseImpl implements IRegisterInstructorUseCase {
  public constructor(
    @inject(TYPES.IUserRepository) private readonly userRepository: IAuthUserRepository,
    @inject(TYPES.IEventPublisherService) private readonly kafkaProducer: IEventPublisher,
    @inject(TYPES.LoggingService) private readonly logger: LoggingService,
    @inject(TYPES.TracingService) private readonly tracer: TracingService,
  ) {}
  public async execute(dto: RegisterInstructorEventDto): Promise<void> {
    return this.tracer.startActiveSpan('UpdateUserUseCaseImpl.execute', async (span) => {
      const { userId } = dto.payload;

      span.setAttributes({
        userId: userId,
      });

      this.logger.debug(`Executing UpdateUserUseCaseImpl for user : ${userId}`);
      // Checks whether user exist with provided userId
      const user = await this.userRepository.findById(userId);

      if (!user) throw new UserNotFoundError(userId);

      user.promoteInstructor();

      await this.userRepository.update(userId, user);

      this.logger.debug(`Instructor register event handled for user ${userId}`);
    });
  }
}

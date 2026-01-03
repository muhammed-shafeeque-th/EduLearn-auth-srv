import IAuthUserRepository from '@/domain/repository/user.repository';
import { inject, injectable } from 'inversify';
import IEventPublisher from '../services/event-publisher.service';
import { LoggingService } from '@/infrastructure/observability/logging/logging.service';
import { TracingService } from '@/infrastructure/observability/tracing/trace.service';
import UserNotFoundError from '@/shared/errors/user-not-found.error';
import { TYPES } from '@/shared/constants/identifiers';
import IRegisterInstructorUseCase from '../adaptors/register-instructor.interface';
import RegisterInstructorEventDto from '../dtos/register-instructor-event.dto';

@injectable()
export default class RegisterInstructorUseCaseImpl implements IRegisterInstructorUseCase {
  public constructor(
    @inject(TYPES.IUserRepository) private readonly userRepository: IAuthUserRepository,
    @inject(TYPES.IEventPublisherService) private readonly kafkaProducer: IEventPublisher,
    @inject(TYPES.LoggingService) private readonly logger: LoggingService,
    @inject(TYPES.TracingService) private readonly tracer: TracingService,
  ) {}
  public async execute(dto: RegisterInstructorEventDto): Promise<void> {
    return this.tracer.startActiveSpan('UpdateUserUseCaseImpl.execute', async (span) => {
      span.setAttributes({
        userId: dto.userId,
      });

      this.logger.debug(`Executing UpdateUserUseCaseImpl for user : ${dto.userId}`);
      // Checks whether user exist with provided userId
      const user = await this.userRepository.findById(dto.userId);

      // Throws an error if user NOT exist with given userId
      if (!user) throw new UserNotFoundError(dto.userId);

      user.promoteInstructor();

      // Copy all enumerable properties from dto into user, override existing properties if any
      // Object.assign(user, tempUser);

      await this.userRepository.update(dto.userId, user);

      this.logger.debug(`Instructor register event handled for user ${dto.userId}`);
    });
  }
}

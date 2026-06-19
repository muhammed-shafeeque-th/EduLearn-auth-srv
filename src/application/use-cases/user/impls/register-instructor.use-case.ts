import IAuthUserRepository from '@/domain/repository/user.repository';
import { inject, injectable } from 'inversify';
import IEventPublisher from '../../../adaptors/event-publisher.service';
import UserNotFoundError from '@/domain/errors/user-not-found.error';
import { TYPES } from '@/shared/constants/identifiers';
import IRegisterInstructorUseCase from '../interfaces/register-instructor.interface';
import RegisterInstructorEventDto from '../../../dtos/register-instructor-event.dto';
import { ITraceService } from '../../../adaptors/trace.service';
import { ILoggerService } from '../../../adaptors/logger.service';

@injectable()
export default class RegisteredInstructorUseCaseImpl implements IRegisterInstructorUseCase {
  public constructor(
    @inject(TYPES.IUserRepository) private readonly _userRepository: IAuthUserRepository,
    @inject(TYPES.IEventPublisherService) private readonly kafkaProducer: IEventPublisher,
    @inject(TYPES.LoggerService)
    private readonly _logger: ILoggerService,
    @inject(TYPES.TraceService)
    private readonly _tracer: ITraceService,
  ) {}
  public async execute(dto: RegisterInstructorEventDto): Promise<void> {
    return this._tracer.startActiveSpan('UpdateUserUseCaseImpl.execute', async (span) => {
      const { userId } = dto.payload;

      span.setAttributes({
        userId: userId,
      });

      this._logger.debug(`Executing UpdateUserUseCaseImpl for user : ${userId}`);
      // Checks whether user exist with provided userId
      const user = await this._userRepository.findById(userId);

      if (!user) throw new UserNotFoundError(userId);

      user.promoteInstructor();

      await this._userRepository.update(userId, user);

      this._logger.debug(`Instructor register event handled for user ${userId}`);
    });
  }
}

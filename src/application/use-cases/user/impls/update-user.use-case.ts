import IAuthUserRepository from '@/domain/repository/user.repository';
import { inject, injectable } from 'inversify';
import IEventPublisher from '../../../adaptors/event-publisher.service';
import UserUpdateDto from '../../../dtos/user-update.event-dto';
import UserNotFoundError from '@/domain/errors/user-not-found.error';
import IUpdateUserUseCase from '../interfaces/update-user.interface';
import { TYPES } from '@/shared/constants/identifiers';
import { ILoggerService } from '../../../adaptors/logger.service';
import { ITraceService } from '../../../adaptors/trace.service';

@injectable()
export default class UpdateUserUseCaseImpl implements IUpdateUserUseCase {
  public constructor(
    @inject(TYPES.IUserRepository) private readonly _userRepository: IAuthUserRepository,
    @inject(TYPES.IEventPublisherService) private readonly kafkaProducer: IEventPublisher,
    @inject(TYPES.LoggerService)
    private readonly _logger: ILoggerService,
    @inject(TYPES.TraceService)
    private readonly _tracer: ITraceService,
  ) {}
  public async execute(dto: UserUpdateDto): Promise<void> {
    return this._tracer.startActiveSpan('UpdateUserUseCaseImpl.execute', async (span) => {
      const { userId } = dto.payload;

      span.setAttributes({
        userId: userId,
      });

      this._logger.debug(`Executing UpdateUserUseCaseImpl for user : ${userId}`);
      // Checks whether user exist with provided userId
      const user = await this._userRepository.findById(userId);

      // Throws an error if user NOT exist with given userId
      if (!user) throw new UserNotFoundError(userId);

      user.updateProfile(dto.payload);

      await this._userRepository.update(userId, user);

      this._logger.debug(`Details updated for user ${userId}`);
    });
  }
}

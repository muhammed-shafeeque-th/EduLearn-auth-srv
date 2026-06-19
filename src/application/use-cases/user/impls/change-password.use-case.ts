import { inject, injectable } from 'inversify';
import { TYPES } from '@/shared/constants/identifiers';
import IUserRepository from '@/domain/repository/user.repository';
import UserNotFoundError from '@/domain/errors/user-not-found.error';
import { IChangePasswordUseCase } from '@/application/use-cases/user/interfaces/change-password.inteface';
import ChangePasswordDto from '@/application/dtos/change-password.dto';
import IHashService from '@/application/adaptors/hash.service';
import BadRequestError from '@/shared/errors/bad-request.error';
import { ILoggerService } from '../../../adaptors/logger.service';
import { ITraceService } from '../../../adaptors/trace.service';

@injectable()
export default class ChangePasswordUseCaseImpl implements IChangePasswordUseCase {
  public constructor(
    @inject(TYPES.IUserRepository) private readonly _userRepository: IUserRepository,
    @inject(TYPES.IHashService) private readonly _hashService: IHashService,
    @inject(TYPES.LoggerService)
    private readonly _logger: ILoggerService,
    @inject(TYPES.TraceService)
    private readonly _tracer: ITraceService,
  ) {}
  public async execute(dto: ChangePasswordDto): Promise<{ userId: string }> {
    return this._tracer.startActiveSpan('ChangePasswordUseCaseImpl.execute', async (span) => {
      span.setAttributes({
        userId: dto.userId,
      });

      this._logger.debug(`Executing ChangePasswordUseCaseImpl for user ${dto.userId}`);
      // Checks whether user exist with provided email
      const user = await this._userRepository.findById(dto.userId);

      // Throws an error if user NOT exist with given email
      if (!user) {
        throw new UserNotFoundError('User not found found with given id');
      }

      if (user.getPassword()) {
        const passwordMatch = await this._hashService.compare(user.getPassword()!, dto.oldPassword);

        if (!passwordMatch)
          throw new BadRequestError(
            'Incorrect current password, please check credential and try again',
          );
      }

      const isSamePrevPassword = await this._hashService.compare(
        user.getPassword()!,
        dto.newPassword,
      );

      if (isSamePrevPassword) {
        throw new BadRequestError(
          "new password and current password can't be the same, please choose another strong password",
        );
      }
      const hashedPassword = await this._hashService.hash(dto.newPassword);

      user.changePassword(hashedPassword);

      await this._userRepository.update(dto.userId, user);

      return { userId: user.getId() };
    });
  }
}

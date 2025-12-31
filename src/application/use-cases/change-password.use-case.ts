import { inject, injectable } from 'inversify';
import { TYPES } from '@/shared/constants/identifiers';
import IUserRepository from '@/domain/repository/user.repository';
import UserNotFoundError from '@/shared/errors/user-not-found.error';
import { IChangePasswordUseCase } from '@/application/adaptors/change-password.inteface';
import ChangePasswordDto from '@/application/dtos/change-password.dto';
import IHashService from '@/application/services/hash.service';
import BadRequestError from '@/shared/errors/bad-request.error';
import { TracingService } from '@/infrastructure/observability/tracing/trace.service';
import { LoggingService } from '@/infrastructure/observability/logging/logging.service';

@injectable()
export default class ChangePasswordUseCaseImpl implements IChangePasswordUseCase {
  public constructor(
    @inject(TYPES.IUserRepository) private readonly userRepository: IUserRepository,
    @inject(TYPES.IHashService) private readonly hashService: IHashService,
    @inject(TYPES.TracingService)
    private readonly tracer: TracingService,
    @inject(TYPES.LoggingService)
    private readonly logger: LoggingService,
  ) {}
  public async execute(dto: ChangePasswordDto): Promise<{ userId: string }> {
    return this.tracer.startActiveSpan('ChangePasswordUseCaseImpl.execute', async (span) => {
      span.setAttributes({
        userId: dto.userId,
      });

      this.logger.debug(`Executing ChangePasswordUseCaseImpl for user ${dto.userId}`);
      // Checks whether user exist with provided email
      const user = await this.userRepository.findById(dto.userId);

      // Throws an error if user NOT exist with given email
      if (!user) {
        throw new UserNotFoundError('User not found found with given id');
      }

      if (user.getPassword()) {
        const passwordMatch = await this.hashService.compare(user.getPassword()!, dto.oldPassword);

        if (!passwordMatch)
          throw new BadRequestError(
            'Incorrect current password, please check credential and try again',
          );
      }

      const isSamePrevPassword = await this.hashService.compare(
        user.getPassword()!,
        dto.newPassword,
      );

      if (isSamePrevPassword) {
        throw new BadRequestError(
          "new password and current password can't be the same, please select another strong password",
        );
      }
      const hashedPassword = await this.hashService.hash(dto.newPassword);

      user.changePassword(hashedPassword);

      await this.userRepository.update(dto.userId, user);

      return { userId: user.getId() };
    });
  }
}

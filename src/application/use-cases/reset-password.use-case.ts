import { inject, injectable } from 'inversify';
import { TYPES } from '@/shared/constants/identifiers';
import IUserRepository from '@/domain/repository/user.repository';
import IHashService from '@/application/services/hash.service';
import { TracingService } from '@/infrastructure/observability/tracing/trace.service';
import { LoggingService } from '@/infrastructure/observability/logging/logging.service';
import { IResetPasswordUseCase } from '../adaptors/reset-password.inteface';
import ResetPasswordDto from '../dtos/reset-password.dto';
import { IPasswordResetTokenRepository } from '@/domain/repository/reset-token.repository ';
import NotFoundError from '@/shared/errors/not-found.error';
import { AuthType } from '@/shared/types/user-types';

@injectable()
export default class ResetPasswordUseCaseImpl implements IResetPasswordUseCase {
  public constructor(
    @inject(TYPES.IUserRepository) private readonly userRepository: IUserRepository,
    @inject(TYPES.IResetTokenRepository)
    private readonly tokenRepository: IPasswordResetTokenRepository,
    @inject(TYPES.IHashService) private readonly hashService: IHashService,
    @inject(TYPES.TracingService)
    private readonly tracer: TracingService,
    @inject(TYPES.LoggingService)
    private readonly logger: LoggingService,
  ) {}
  public async execute(dto: ResetPasswordDto): Promise<{ userId: string }> {
    return await this.tracer.startActiveSpan('ResetPasswordUseCaseImpl.execute', async () => {
      // span.setAttributes({
      //   userId: dto.userId,
      // });

      this.logger.debug(`Executing ResetPasswordUseCaseImpl `);
      // Checks whether user exist with provided email
      const dbResponse = await this.tokenRepository.findUserByToken(dto.token);

      // Throws an error if token NOT exist with given email
      if (!dbResponse) throw new NotFoundError(`Invalid token please check your token`);
      const { user, token } = dbResponse;

      // Validate whether token expired or not
      token.validate();
      token.markAsUsed();

      const hashedPassword = await this.hashService.hash(dto.password);

      user.changePassword(hashedPassword);
      user.changeAuthType(AuthType.EMAIL);

      // save changes to db
      await Promise.all([
        this.tokenRepository.updateToken(token.id, token),
        this.userRepository.update(user.getId(), user),
      ]);

      return { userId: user.getId() };
    });
  }
}

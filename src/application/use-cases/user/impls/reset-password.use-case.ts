import { inject, injectable } from 'inversify';
import { TYPES } from '@/shared/constants/identifiers';
import IUserRepository from '@/domain/repository/user.repository';
import IHashService from '@/application/adaptors/hash.service';
import { IResetPasswordUseCase } from '../interfaces/reset-password.inteface';
import ResetPasswordDto from '../../../dtos/reset-password.dto';
import { IPasswordResetTokenRepository } from '@/domain/repository/reset-token.repository';
import NotFoundError from '@/shared/errors/not-found.error';
import { AuthType } from '@/domain/entity/user';
import { ILoggerService } from '../../../adaptors/logger.service';
import { ITraceService } from '../../../adaptors/trace.service';

@injectable()
export default class ResetPasswordUseCaseImpl implements IResetPasswordUseCase {
  public constructor(
    @inject(TYPES.IUserRepository) private readonly _userRepository: IUserRepository,
    @inject(TYPES.IResetTokenRepository)
    private readonly _tokenRepository: IPasswordResetTokenRepository,
    @inject(TYPES.IHashService) private readonly _hashService: IHashService,
    @inject(TYPES.LoggerService)
    private readonly _logger: ILoggerService,
    @inject(TYPES.TraceService)
    private readonly _tracer: ITraceService,
  ) {}
  public async execute(dto: ResetPasswordDto): Promise<{ userId: string }> {
    return await this._tracer.startActiveSpan('ResetPasswordUseCaseImpl.execute', async () => {
      // span.setAttributes({
      //   userId: dto.userId,
      // });

      this._logger.debug(`Executing ResetPasswordUseCaseImpl `);
      // Checks whether user exist with provided email
      const dbResponse = await this._tokenRepository.findUserByToken(dto.token);

      // Throws an error if token NOT exist with given email
      if (!dbResponse) throw new NotFoundError(`Invalid token please check your token`);
      const { user, token } = dbResponse;

      // Validate whether token expired or not
      token.validate();
      token.markAsUsed();

      const hashedPassword = await this._hashService.hash(dto.password);

      user.changePassword(hashedPassword);
      user.changeAuthType(AuthType.EMAIL);

      // save changes to db
      await Promise.all([
        this._tokenRepository.updateToken(token.id, token),
        this._userRepository.update(user.getId(), user),
      ]);

      return { userId: user.getId() };
    });
  }
}

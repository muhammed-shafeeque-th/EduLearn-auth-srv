import { inject, injectable } from 'inversify';
import { TYPES } from '@/shared/constants/identifiers';
import LogoutUserDto from '@/application/dtos/logout.dto';
import UserNotFoundError from '@/shared/errors/not-found.error';
import IUserRepository from '@/domain/repository/user.repository';
import ILogoutUserUseCase from '@/application/adaptors/logout.interface';
import { TracingService } from '@/infrastructure/observability/tracing/trace.service';
import { LoggingService } from '@/infrastructure/observability/logging/logging.service';
import { IRefreshTokenRepository } from '@/domain/repository/refresh-token.repository';
// import { AuthType } from '@/shared/types/user-types';

@injectable()
export default class LogoutUserUseCaseImpl implements ILogoutUserUseCase {
  public constructor(
    @inject(TYPES.IUserRepository) private readonly userRepository: IUserRepository,
    @inject(TYPES.IRefreshTokenRepository)
    private readonly tokenRepository: IRefreshTokenRepository,
    @inject(TYPES.TracingService)
    private readonly tracer: TracingService,
    @inject(TYPES.LoggingService)
    private readonly logger: LoggingService,
  ) {}
  public async execute(dto: LogoutUserDto): Promise<{ userId: string }> {
    return await this.tracer.startActiveSpan('LogoutUserUseCaseImpl.execute', async (span) => {
      span.setAttributes({
        'user.id': dto.userId,
      });

      this.logger.debug(`Executing Logout for user  ${dto.userId}`);
      // Checks whether user exist with provided email
      const user = await this.userRepository.findById(dto.userId);

      // Creates user if user not already exists
      if (!user) {
        this.logger.error(`user not found with Id ${dto.userId}`);
        throw new UserNotFoundError('user not found with provided userId');
      }

      // Mark user status as not active
      user.deactivate();

      // Save user to db
      await this.userRepository.update(user.getId(), user);
      // await this.tokenRepository.updateToken(user.getId(), user);

      this.logger.debug('Successfully completed the logout process for user ' + dto.userId);
      return { userId: user.getId() };
    });
  }
}

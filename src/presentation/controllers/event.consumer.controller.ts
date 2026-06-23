import OtpVerifiedEventDto from '@/application/dtos/otp-verified-event.dto';
import RegisterInstructorEventDto from '@/application/dtos/register-instructor-event.dto';
import UserUpdateDto from '@/application/dtos/user-update.event-dto';
import IRegisterInstructorUseCase from '@/application/use-cases/user/interfaces/register-instructor.interface';
import IUpdateUserUseCase from '@/application/use-cases/user/interfaces/update-user.interface';
import { IVerifyUserUseCase } from '@/application/use-cases/user/interfaces/verify-user.interface';
import { EventPattern } from '@/infrastructure/kafka/decorators.kafka';
import { DeserializedMessage } from '@/infrastructure/kafka/kafka.types';
import { TYPES } from '@/shared/constants/identifiers';
import { KafkaTopics } from '@/shared/events';
import {
  UserAccountBlockedEvent,
  UserAccountUnblockedEvent,
  UserAccountUpdatedEvent,
} from '@/domain/events/types/user-lifecycle.events';
import { inject, injectable } from 'inversify';
import BlockUserDto from '@/application/dtos/account-blocked.event-dto';
import { IAccountBlockedUseCase } from '@/application/use-cases/user/interfaces/block-account.interface';
import { IAccountUnblockedUseCase } from '@/application/use-cases/user/interfaces/unblock-account.interface';
import VerifyUserDto from '@/application/dtos/verify-user.dto';
import UserUnblockedDto, {
  InstructorUnblockedEvent,
} from '@/application/dtos/instructor-unblocked.event-dto';
import { IInstructorBlockedUseCase } from '@/application/use-cases/user/interfaces/instructor-blocked.interface';
import { IInstructorUnBlockedUseCase } from '@/application/use-cases/user/interfaces/instructor-unblocked.interface';
import { InstructorRegisteredEvent } from '@/domain/events/types/instructor.events';
import { InstructorBlockedEvent } from '@/application/dtos/instructor-blocked.event-dto';
import { ITraceService } from '@/application/adaptors/trace.service';
import { ILoggerService } from '@/application/adaptors/logger.service';

@injectable()
export class EventConsumerController {
  public constructor(
    @inject(TYPES.IUpdateUserUseCase)
    private readonly _updateUserUseCase: IUpdateUserUseCase,
    @inject(TYPES.IRegisterInstructorUseCase)
    private readonly _registerInstructorUseCase: IRegisterInstructorUseCase,
    @inject(TYPES.IAccountBlockedUseCase)
    private readonly _accountBlockedUseCase: IAccountBlockedUseCase,
    @inject(TYPES.IAccountUnblockedUseCase)
    private readonly _accountUnblockUseCase: IAccountUnblockedUseCase,
    @inject(TYPES.IInstructorBlockedUseCase)
    private readonly _instructorBlockedUseCase: IInstructorBlockedUseCase,
    @inject(TYPES.IInstructorUnblockedUseCase)
    private readonly _instructorUnblockedUseCase: IInstructorUnBlockedUseCase,
    @inject(TYPES.IVerifyUserUseCase)
    private readonly _verifyUserUseCase: IVerifyUserUseCase,
    @inject(TYPES.TraceService)
    private readonly _tracer: ITraceService,
    @inject(TYPES.LoggerService)
    private readonly _logger: ILoggerService,
  ) {}

  @EventPattern({
    topic: KafkaTopics.UserAccountUpdated,
    // schemaType: UserUpdateDto
  })
  public async handleUserUpdateEvent(
    data: UserAccountUpdatedEvent,
    _context: DeserializedMessage<UserAccountUpdatedEvent>,
  ): Promise<void> {
    this._logger.debug(`handling UserAccountUpdatedEvent kafka  method`);
    // this._logger.debug(
    //   `Subscribing event for topic ${KafkaTopics.UserAccountUpdated}, with data : ${JSON.stringify(data, null, 2)},  for new user: ${data.payload}`,
    // );
    await this._updateUserUseCase.execute(data as UserUpdateDto);
  }

  @EventPattern({
    topic: KafkaTopics.AuthOTPVerified,
    //  schemaType: OtpVerifiedEventDto
  })
  public async handleAuthVerifiedEvent(
    data: OtpVerifiedEventDto,
    _context: DeserializedMessage<OtpVerifiedEventDto>,
  ): Promise<void> {
    // this._logger.debug(
    //   `Subscribing event for topic ${KafkaTopics.AuthOTPVerified}, with data : ${JSON.stringify(data, null, 2)},  for new user: ${data.payload}`,
    // );
    await this._verifyUserUseCase.execute(data.payload as VerifyUserDto);
  }

  @EventPattern({
    topic: KafkaTopics.UserInstructorRegistered,
    // schemaType: RegisterInstructorEventDto,
  })
  public async handleInstructorRegisteredEvent(
    data: RegisterInstructorEventDto,
    _context: DeserializedMessage<InstructorRegisteredEvent>,
  ): Promise<void> {
    this._logger.debug(`handling event for topic ${KafkaTopics.UserInstructorRegistered}`);
    await this._registerInstructorUseCase.execute(data as RegisterInstructorEventDto);
  }

  @EventPattern({
    topic: KafkaTopics.UserAccountBlocked,
    //  schemaType: OtpVerifiedEventDto
  })
  public async handleUserAccountBlockedEvent(
    data: BlockUserDto,
    _context: DeserializedMessage<UserAccountBlockedEvent>,
  ): Promise<void> {
    // this._logger.debug(
    //   `Subscribing event for topic ${KafkaTopics.AuthOTPVerified}, with data : ${JSON.stringify(data, null, 2)},  for new user: ${data.payload}`,
    // );
    await this._accountBlockedUseCase.execute(data as BlockUserDto);
  }

  @EventPattern({
    topic: KafkaTopics.UserAccountUnblocked,
    // schemaType: RegisterInstructorEventDto,
  })
  public async handleUserAccountUnblockedEvent(
    data: UserAccountUnblockedEvent,
    _context: DeserializedMessage<UserAccountUnblockedEvent>,
  ): Promise<void> {
    await this._accountUnblockUseCase.execute(data as UserUnblockedDto);
  }
  @EventPattern({
    topic: KafkaTopics.UserInstructorBlocked,
    //  schemaType: OtpVerifiedEventDto
  })
  public async handleInstructorBlockedEvent(
    data: BlockUserDto,
    _context: DeserializedMessage<InstructorBlockedEvent>,
  ): Promise<void> {
    await this._instructorBlockedUseCase.execute(data);
  }

  @EventPattern({
    topic: KafkaTopics.UserInstructorUnblocked,
    // schemaType: RegisterInstructorEventDto,
  })
  public async handleInstructorUnblockedEvent(
    data: InstructorUnblockedEvent,
    _context: DeserializedMessage<InstructorUnblockedEvent>,
  ): Promise<void> {
    // this._logger.debug(
    //   `Subscribing event for topic ${KafkaTopics.UserUnblocked}, with data : ${JSON.stringify(data, null, 2)},  for new user: ${data.payload}`,
    // );
    await this._instructorUnblockedUseCase.execute(data as UserUnblockedDto);
  }
}

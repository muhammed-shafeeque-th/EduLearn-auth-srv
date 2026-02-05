import OtpVerifiedEventDto from '@/application/dtos/otp-verified-event.dto';
import RegisterInstructorEventDto from '@/application/dtos/register-instructor-event.dto';
import UserUpdateDto from '@/application/dtos/user-update.event-dto';
import IRegisterInstructorUseCase from '@/application/adaptors/register-instructor.interface';
import IUpdateUserUseCase from '@/application/adaptors/update-user.interface';
import { IVerifyUserUseCase } from '@/application/adaptors/verify-user.interface';
import { EventPattern } from '@/infrastructure/kafka/decorators.kafka';
import { DeserializedMessage } from '@/infrastructure/kafka/kafka.types';
import { LoggingService } from '@/infrastructure/observability/logging/logging.service';
import { TracingService } from '@/infrastructure/observability/tracing/trace.service';
import { TYPES } from '@/shared/constants/identifiers';
import { KafkaTopics } from '@/shared/events';
import {
  UserBlockedEvent,
  UserUnblockedEvent,
  UserUpdatedEvent,
} from '@/domain/events/types/user-service.events';
import { inject, injectable } from 'inversify';
import BlockUserDto from '@/application/dtos/user-blocked.event-dto';
import { IUserBlockedUseCase } from '@/application/adaptors/block-user.interface';
import { IUserUnblockedUseCase } from '@/application/adaptors/unblock-user.interface';
import VerifyUserDto from '@/application/dtos/verify-user.dto';
import UserUnblockedDto from '@/application/dtos/unblock-user.event-dto';

@injectable()
export class EventConsumerController {
  public constructor(
    @inject(TYPES.IUpdateUserUseCase)
    private readonly updateUserUseCase: IUpdateUserUseCase,
    @inject(TYPES.IRegisterInstructorUseCase)
    private readonly registerInstructorUseCase: IRegisterInstructorUseCase,
    @inject(TYPES.IBlockUserUseCase)
    private readonly blockUserUseCase: IUserBlockedUseCase,
    @inject(TYPES.IUnBlockUserUseCase)
    private readonly unBlockUserUseCase: IUserUnblockedUseCase,
    @inject(TYPES.IVerifyUserUseCase)
    private readonly verifyUserUseCase: IVerifyUserUseCase,
    @inject(TYPES.TracingService)
    private readonly tracer: TracingService,
    @inject(TYPES.LoggingService)
    private readonly logger: LoggingService,
  ) {}

  @EventPattern({
    topic: KafkaTopics.UserUpdated,
    // schemaType: UserUpdateDto
  })
  public async handleUserUpdateEvent(
    data: UserUpdatedEvent,
    _context: DeserializedMessage<UserUpdatedEvent>,
  ): Promise<void> {
    this.logger.debug(
      `Subscribing event for topic ${KafkaTopics.UserUpdated}, with data : ${JSON.stringify(data, null, 2)},  for new user: ${data.payload}`,
    );
    await this.updateUserUseCase.execute(data as UserUpdateDto);
  }

  @EventPattern({
    topic: KafkaTopics.AuthOTPVerified,
    //  schemaType: OtpVerifiedEventDto
  })
  public async handleAuthVerifiedEvent(
    data: OtpVerifiedEventDto,
    _context: DeserializedMessage<OtpVerifiedEventDto>,
  ): Promise<void> {
    this.logger.debug(
      `Subscribing event for topic ${KafkaTopics.AuthOTPVerified}, with data : ${JSON.stringify(data, null, 2)},  for new user: ${data.payload}`,
    );
    await this.verifyUserUseCase.execute(data.payload as VerifyUserDto);
  }

  @EventPattern({
    topic: KafkaTopics.UserInstructorRegistered,
    // schemaType: RegisterInstructorEventDto,
  })
  public async handleInstructorRegisteredEvent(
    data: RegisterInstructorEventDto,
    _context: DeserializedMessage<UserUpdatedEvent>,
  ): Promise<void> {
    this.logger.debug(
      `Subscribing event for topic ${KafkaTopics.AuthOTPVerified}, with data : ${JSON.stringify(data, null, 2)},  for new user: ${data.payload?.userId}`,
    );
    await this.registerInstructorUseCase.execute(data as RegisterInstructorEventDto);
  }

  @EventPattern({
    topic: KafkaTopics.UserBlocked,
    //  schemaType: OtpVerifiedEventDto
  })
  public async handleUserBlockedEvent(
    data: BlockUserDto,
    _context: DeserializedMessage<UserBlockedEvent>,
  ): Promise<void> {
    this.logger.debug(
      `Subscribing event for topic ${KafkaTopics.AuthOTPVerified}, with data : ${JSON.stringify(data, null, 2)},  for new user: ${data.payload}`,
    );
    await this.blockUserUseCase.execute(data as BlockUserDto);
  }

  @EventPattern({
    topic: KafkaTopics.UserUnblocked,
    // schemaType: RegisterInstructorEventDto,
  })
  public async handleUserUnblockedEvent(
    data: UserUnblockedEvent,
    _context: DeserializedMessage<UserUnblockedEvent>,
  ): Promise<void> {
    this.logger.debug(
      `Subscribing event for topic ${KafkaTopics.UserUnblocked}, with data : ${JSON.stringify(data, null, 2)},  for new user: ${data.payload}`,
    );
    await this.unBlockUserUseCase.execute(data as UserUnblockedDto);
  }
}

import { IsEmail, IsUUID } from 'class-validator';
import BaseEventDto from './base-event.dto';
import { OtpVerifiedEvent } from '@/domain/events/types/notification-service.events';

export class OtpVerifiedEventDtoPayload implements OtpVerifiedEvent {
  @IsUUID()
  userId!: string;

  username: string;

  eventId: string;
  eventType: string;
  timestamp: number;

  @IsEmail({}, { message: 'Invalid email format' })
  email!: string;

  status: string;
}

export default class UserUpdateDto extends BaseEventDto<OtpVerifiedEventDtoPayload> {}

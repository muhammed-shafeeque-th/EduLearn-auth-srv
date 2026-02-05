/* eslint-disable @typescript-eslint/no-empty-object-type */
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import BaseEventDto from './base-event.dto';
import { UserStatus } from '@/shared/types/user-status';
import { UserRoles } from '@/shared/types/user-types';
import { BaseEvent } from '@/domain/events/types/base-event';

export interface UserBlockedEvent
  extends BaseEvent<{
    userId: string;
    email: string;
    role: UserRoles;
    status: UserStatus.BLOCKED;
    firstName?: string;
    avatar?: string;
  }> {}

export class UserBlockedPayload {
  @IsString()
  @IsNotEmpty({ message: 'userId is required' })
  userId!: string;

  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'email is required' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'role is required' })
  role!: string;

  @IsString()
  @IsNotEmpty({ message: 'status is required' })
  status!: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}
export default class UserBlockedDto extends BaseEventDto<UserBlockedPayload> {}

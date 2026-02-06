import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsEnum,
  IsString,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { UserRoles } from '@/shared/types/user-types';
import { UserStatus } from '@/shared/types/user-status';
import BaseEventDto from './base-event.dto';
import { UserUpdatedEvent } from '@/domain/events/types/user-service.events';

export class UserUpdateDtoPayload implements UserUpdatedEvent {
  @IsUUID()
  userId!: string;

  eventId: string;
  eventType: string;
  timestamp: number;

  @IsEmail({}, { message: 'Invalid email format' })
  email!: string;

  @IsOptional()
  @IsString()
  username!: string;

  @IsString({ message: 'Avatar must be a valid string' })
  @IsOptional()
  avatar?: string;

  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(3, { message: 'Name must be at least 3 characters long' })
  firstName: string;

  @IsOptional({ message: 'Name is required' })
  @MinLength(3, { message: 'Name must be at least 3 characters long' })
  lastName?: string;

  @IsEnum(UserRoles, { message: 'Role must be one of the valid user roles' })
  role: UserRoles;

  @IsEnum(UserStatus, { message: 'status must be one of the valid user statuss' })
  status: UserStatus;
}

export default class UserUpdateDto extends BaseEventDto<UserUpdateDtoPayload> {}

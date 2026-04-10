import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import BaseEventDto from './base-event.dto';
import { UserStatus, UserRoles } from '@/domain/entity/user';
import { BaseEvent } from '@/domain/events/types/base-event';

export type AccountBlockedEvent = BaseEvent<{
  userId: string;
  email: string;
  role: UserRoles;
  status: UserStatus.BLOCKED;
  firstName?: string;
  avatar?: string;
  roles?: UserRoles[];
  roleStatus?: Record<UserRoles, string>;
}>;

export class AccountBlockedPayload {
  @IsString()
  @IsNotEmpty({ message: 'userId is required' })
  userId!: string;

  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'email is required' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'status is required' })
  status!: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  roles?: UserRoles[];

  @IsOptional()
  roleStatus?: Record<UserRoles, string>;
}
export default class AccountBlockedDto extends BaseEventDto<AccountBlockedPayload> {}

import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsEnum,
  IsString,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { AuthType, UserRoles } from '@/shared/types/user-types';
import BaseEventDto from './base-event.dto';

// -----------
// Payload DTO: Focused on only business fields for instructor registration
// -----------
export class RegisterInstructorEventDtoPayload {
  @IsUUID()
  userId!: string;

  @IsEmail({}, { message: 'Invalid email format' })
  email!: string;

  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password!: string;

  @IsString({ message: 'Avatar must be a valid string' })
  @IsOptional()
  avatar?: string;

  @IsNotEmpty({ message: 'First name is required' })
  @MinLength(3, { message: 'First name must be at least 3 characters long' })
  firstName!: string;

  @IsOptional()
  @MinLength(3, { message: 'Last name must be at least 3 characters long' })
  lastName?: string;

  @IsEnum(UserRoles, { message: 'Role must be one of the valid user roles' })
  role!: UserRoles;

  @IsEnum(AuthType, { message: 'AuthType must be one of the valid auth types' })
  authType!: AuthType;
}

export default class RegisterInstructorEventDto extends BaseEventDto<RegisterInstructorEventDtoPayload> {}

/* eslint-disable @typescript-eslint/no-empty-object-type */
import { IsEmail, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import BaseEventDto from './base-event.dto';
import { BaseEvent } from '@/domain/events/types/base-event';

export interface InstructorUnblockedEvent extends BaseEvent<{
  userId: string;
  email: string;
  role: string;
  status: string;
  firstName?: string;
  avatar?: string;
  roles?: string[];
  roleStatus?: Record<string, string>;
}> {}

export class InstructorUnblockedDtoPayload {
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
  roles?: string[];

  @IsOptional()
  roleStatus?: Record<string, string>;
}

export default class InstructorUnblockedDto extends BaseEventDto<InstructorUnblockedDtoPayload> {}

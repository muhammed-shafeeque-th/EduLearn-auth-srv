/* eslint-disable @typescript-eslint/no-empty-object-type */
import { UserRoles, UserStatus } from '@/domain/entity/user';
import { BaseEvent } from './base-event';

export interface UserAccountUpdatedEvent
  extends BaseEvent<{
    userId: string;
    username: string;
    email: string;
    roles: UserRoles[];
    firstName?: string;
    lastName?: string;
    avatar?: string;
    status: UserStatus;
  }> {}

export interface UserAccountBlockedEvent
  extends BaseEvent<{
    userId: string;
    email: string;
    roles: UserRoles[];
    status: UserStatus.BLOCKED;
    firstName?: string;
    avatar?: string;
  }> {}

export interface UserAccountUnblockedEvent
  extends BaseEvent<{
    userId: string;
    email: string;
    roles: UserRoles[];
    status: Exclude<UserStatus, UserStatus.BLOCKED>;
    firstName?: string;
    avatar?: string;
  }> {}

export interface UserAccountCreatedEvent
  extends BaseEvent<{
    userId: string;
    email: string;
    roles: UserRoles[];
    firstName?: string;
    lastName?: string;
    avatar?: string;
    status?: UserStatus;
    createdAt?: Date;
  }> {}
export default interface UserRegisterEvent
  extends BaseEvent<{
    userId: string;
    email: string;
    roles: UserRoles[];
    firstName?: string;
    lastName?: string;
    avatar?: string;
    status?: UserStatus;
    createdAt?: Date;
  }> {}

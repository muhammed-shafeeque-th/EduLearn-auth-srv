import { RoleStatus, UserRoles, UserStatus } from '@/domain/entity/user';
import { BaseEvent } from './base-event';

export type InstructorRegisteredEvent = BaseEvent<{
  userId: string;
  email: string;
  roles: [UserRoles.STUDENT, UserRoles.INSTRUCTOR];
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  status?: UserStatus;
}>;

export type InstructorRoleBlockedEvent = BaseEvent<{
  userId: string;
  email: string;
  status: UserStatus;
  roles?: UserRoles[];
  roleStatus?: Record<UserRoles, RoleStatus>;
}>;

export type InstructorRoleUnBlockedEvent = BaseEvent<{
  userId: string;
  email: string;
  status: UserStatus;
  roles?: UserRoles[];
  roleStatus?: Record<UserRoles, RoleStatus>;
}>;

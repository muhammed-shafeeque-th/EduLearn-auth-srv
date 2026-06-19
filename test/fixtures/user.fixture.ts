import User, { AuthType, UserRoles, UserStatus } from '@/domain/entity/user';
import UserEntity from '@/infrastructure/database/entities/user';
import { FAKE_EMAIL, FAKE_HASHED_PASSWORD, FAKE_USER_ID } from './constants';

export interface UserFixtureOptions {
  id?: string;
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  authType?: AuthType;
  roles?: UserRoles[];
  status?: UserStatus;
  avatar?: string;
}

export function buildUser(overrides: UserFixtureOptions = {}): User {
  return User.create({
    id: overrides.id ?? FAKE_USER_ID,
    email: overrides.email ?? FAKE_EMAIL,
    password: overrides.password ?? FAKE_HASHED_PASSWORD,
    firstName: overrides.firstName ?? 'John',
    lastName: overrides.lastName ?? 'Doe',
    authType: overrides.authType ?? AuthType.EMAIL,
    roles: overrides.roles ?? [UserRoles.STUDENT],
    status: overrides.status ?? UserStatus.NOT_VERIFIED,
    avatar: overrides.avatar,
  });
}

export function buildActiveUser(overrides: UserFixtureOptions = {}): User {
  const user = buildUser({ ...overrides, status: UserStatus.ACTIVE });
  user.login();
  return user;
}

export function buildBlockedUser(overrides: UserFixtureOptions = {}): User {
  const user = buildUser(overrides);
  user.block();
  return user;
}

export function buildOAuthUser(overrides: UserFixtureOptions = {}): User {
  return buildUser({
    ...overrides,
    authType: AuthType.OAUTH,
    password: undefined,
  });
}

export function buildInstructorUser(overrides: UserFixtureOptions = {}): User {
  const user = buildUser(overrides);
  user.promoteInstructor();
  return user;
}
export function buildUserEntity(overrides: UserFixtureOptions = {}): UserEntity {
  const domain = buildUser(overrides);
  const entity = new UserEntity();
  entity.id = domain.getId();
  entity.email = domain.getEmail();
  entity.password = domain.getPassword()!;
  entity.firstName = domain.getFirstName();
  entity.lastName = domain.getLastName();
  entity.roles = domain.getRoles();
  entity.authType = domain.getAuthType();
  entity.status = domain.getStatus();
  entity.avatar = domain.getAvatar();
  entity.createdAt = domain.getCreatedAt();
  entity.updatedAt = domain.getUpdatedAt();
  entity.lastLogin = domain.getLastLogin();
  entity.refreshTokens = [];
  entity.resetToken = [];
  return entity;
}

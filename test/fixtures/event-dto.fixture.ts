import AccountBlockedDto from '@/application/dtos/account-blocked.event-dto';
import AccountUnblockedDto from '@/application/dtos/instructor-unblocked.event-dto'; // same DTO shape used by account-unblocked use case
import RegisterInstructorEventDto from '@/application/dtos/register-instructor-event.dto';
import InstructorBlockedDto from '@/application/dtos/instructor-blocked.event-dto';
import InstructorUnblockedDto from '@/application/dtos/instructor-unblocked.event-dto';
import UserUpdateDto from '@/application/dtos/user-update.event-dto';
import { AuthType, UserRoles, UserStatus } from '@/domain/entity/user';
import { FAKE_EMAIL, FAKE_USER_ID } from './constants';

export function buildAccountBlockedDto(
  payload: Partial<AccountBlockedDto['payload']> = {},
): AccountBlockedDto {
  const dto = new AccountBlockedDto();
  dto.eventId = 'event-1';
  dto.eventType = 'AccountBlockedEvent';
  dto.timestamp = Date.now();
  dto.payload = {
    userId: FAKE_USER_ID,
    email: FAKE_EMAIL,
    ...payload,
  } as AccountBlockedDto['payload'];
  return dto;
}

export function buildAccountUnblockedDto(
  payload: Partial<AccountUnblockedDto['payload']> = {},
): AccountUnblockedDto {
  const dto = new AccountUnblockedDto();
  dto.eventId = 'event-1';
  dto.eventType = 'AccountUnblockedEvent';
  dto.timestamp = Date.now();
  dto.payload = {
    userId: FAKE_USER_ID,
    email: FAKE_EMAIL,
    ...payload,
  } as AccountUnblockedDto['payload'];
  return dto;
}

export function buildRegisterInstructorEventDto(
  userId = FAKE_USER_ID,
): RegisterInstructorEventDto {
  const dto = new RegisterInstructorEventDto();
  dto.eventId = 'event-1';
  dto.eventType = 'RegisterInstructorEvent';
  dto.timestamp = Date.now();
  dto.payload = {
    userId,
    email: 'instructor@example.com',
    firstName: 'Jane',
    lastName: 'Doe',
    roles: [UserRoles.STUDENT],
    authType: AuthType.EMAIL,
  };
  return dto;
}

export function buildInstructorBlockedDto(
  payload: Partial<InstructorBlockedDto['payload']> = {},
): InstructorBlockedDto {
  const dto = new InstructorBlockedDto();
  dto.eventId = 'event-1';
  dto.eventType = 'InstructorBlockedEvent';
  dto.timestamp = Date.now();
  dto.payload = {
    userId: FAKE_USER_ID,
    email: FAKE_EMAIL,
    ...payload,
  } as InstructorBlockedDto['payload'];
  return dto;
}

export function buildInstructorUnblockedDto(
  payload: Partial<InstructorUnblockedDto['payload']> = {},
): InstructorUnblockedDto {
  const dto = new InstructorUnblockedDto();
  dto.eventId = 'event-1';
  dto.eventType = 'InstructorUnblockedEvent';
  dto.timestamp = Date.now();
  dto.payload = {
    userId: FAKE_USER_ID,
    email: FAKE_EMAIL,
    ...payload,
  } as InstructorUnblockedDto['payload'];
  return dto;
}

export function buildUserUpdateDto(
  payload: Partial<UserUpdateDto['payload']> = {},
): UserUpdateDto {
  const dto = new UserUpdateDto();
  dto.eventId = 'event-1';
  dto.eventType = 'UserUpdateEvent';
  dto.timestamp = Date.now();
  dto.payload = {
    userId: FAKE_USER_ID,
    firstName: 'Updated',
    lastName: 'Name',
    ...payload,
  } as UserUpdateDto['payload'];
  return dto;
}

export { UserStatus };

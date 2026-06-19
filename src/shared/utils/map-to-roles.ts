import { UserRoles } from '@/domain/entity/user';

export const mapToRoles = (role: string): UserRoles => {
  switch (role) {
    case UserRoles.ADMIN:
      return UserRoles.ADMIN;
    case UserRoles.INSTRUCTOR:
      return UserRoles.INSTRUCTOR;
    case UserRoles.STUDENT:
      return UserRoles.STUDENT;
    default:
      throw Error('Invalid user role');
  }
};

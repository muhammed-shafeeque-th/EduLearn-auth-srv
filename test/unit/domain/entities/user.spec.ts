import User, { AuthType, RoleStatus, UserRoles, UserStatus } from '@/domain/entity/user';

describe('User entity', () => {
  const baseProps = {
    id: 'user-1',
    email: 'john@example.com',
    authType: AuthType.EMAIL,
    firstName: 'John',
    password: 'secure123',
  };

  describe('create', () => {
    it('creates a user with default role and status', () => {
      const user = User.create(baseProps);

      expect(user.getId()).toBe(baseProps.id);
      expect(user.getEmail()).toBe(baseProps.email);
      expect(user.getFirstName()).toBe(baseProps.firstName);
      expect(user.getAuthType()).toBe(AuthType.EMAIL);
      expect(user.getRoles()).toEqual([UserRoles.STUDENT]);
      expect(user.getStatus()).toBe(UserStatus.NOT_VERIFIED);
      expect(user.getCreatedAt()).toBeInstanceOf(Date);
      expect(user.getUpdatedAt()).toBeInstanceOf(Date);
      expect(user.getLastLogin()).toBeInstanceOf(Date);
      expect(user.getPassword()).toBe(baseProps.password);
    });

    it('creates a user with all provided values', () => {
      const user = User.create({
        ...baseProps,
        authType: AuthType.OAUTH,
        lastName: 'Doe',
        authProvider: 'google',
        avatar: 'http://avatar',
        roles: [UserRoles.INSTRUCTOR],
      });

      expect(user.getLastName()).toBe('Doe');
      expect(user.getAuthProvider()).toBe('google');
      expect(user.getAvatar()).toBe('http://avatar');
      expect(user.getRoles()).toEqual([UserRoles.INSTRUCTOR]);
      expect(user.isOAuth()).toBe(true);
    });
  });

  describe('domain behavior', () => {
    let user: User;

    beforeEach(() => {
      user = User.create(baseProps);
    });

    it('activates the account on login', () => {
      user.login();

      expect(user.getStatus()).toBe(UserStatus.ACTIVE);
      expect(user.getLastLogin()).toBeInstanceOf(Date);
    });

    it('does not login when blocked', () => {
      user.block();

      expect(user.login()).toBe(false);
      expect(user.getStatus()).toBe(UserStatus.BLOCKED);
    });

    it('verifies, blocks, and unblocks the user', () => {
      user.verify();
      expect(user.getStatus()).toBe(UserStatus.VERIFIED);

      user.block();
      expect(user.isBlocked()).toBe(true);

      user.unblock();
      expect(user.getStatus()).toBe(UserStatus.ACTIVE);
    });

    it('promotes a user to instructor', () => {
      user.promoteInstructor();

      expect(user.isInstructor()).toBe(true);
      expect(user.getRoles()).toContain(UserRoles.INSTRUCTOR);
    });

    it('updates profile details', () => {
      user.updateProfile({
        firstName: 'Jane',
        lastName: 'Smith',
        username: 'janeuser',
        avatar: 'http://avatar2',
      });

      expect(user.getFirstName()).toBe('Jane');
      expect(user.getLastName()).toBe('Smith');
      expect(user.getUsername()).toBe('janeuser');
      expect(user.getAvatar()).toBe('http://avatar2');
    });

    it('changes password and auth type', () => {
      user.changePassword('newpassword123');
      user.changeAuthType(AuthType.OAUTH);

      expect(user.getPassword()).toBe('newpassword123');
      expect(user.getAuthType()).toBe(AuthType.OAUTH);
    });

    it('syncs roles and status from external events', () => {
      user.syncRolesAndStatus({
        roles: [UserRoles.ADMIN],
        roleStatus: { [UserRoles.ADMIN]: RoleStatus.ACTIVE },
        status: UserStatus.ACTIVE,
      });

      expect(user.getRoles()).toEqual([UserRoles.ADMIN]);
      expect(user.getStatus()).toBe(UserStatus.ACTIVE);
    });

    it('prevents demoting admin directly to student', () => {
      const admin = User.create({
        ...baseProps,
        roles: [UserRoles.ADMIN],
      });

      expect(() => admin.changeRole(UserRoles.STUDENT)).toThrow(
        'Cannot demote ADMIN to STUDENT directly.',
      );
    });
  });
});

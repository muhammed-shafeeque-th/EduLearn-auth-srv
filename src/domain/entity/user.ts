interface UserProps {
  id: string;
  email: string;
  authType: AuthType;
  firstName: string;
  password?: string;
  lastName?: string;
  avatar?: string;
  authProvider?: string;
  username?: string;
  roles?: UserRoles[];
  roleStatus?: Partial<Record<UserRoles, RoleStatus>>;
  status?: UserStatus;
  createdAt?: Date;
  updatedAt?: Date;
  lastLogin?: Date;
}

// export enum UserStatus {
//   ACTIVE = 'active',
//   BLOCKED = 'blocked',
//   DELETED = 'deleted',
// }

export enum RoleStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  BLOCKED = 'blocked',
}

export enum UserStatus {
  VERIFIED = 'verified',
  NOT_VERIFIED = 'not-verified',
  ACTIVE = 'active',
  NOT_ACTIVE = 'not-active',
  BLOCKED = 'blocked',
  DELETED = 'deleted',
}

export enum UserRoles {
  ADMIN = 'admin',
  INSTRUCTOR = 'instructor',
  STUDENT = 'student',
}

export enum AuthType {
  EMAIL = 'email',
  OAUTH = 'oauth',
}

export default class User {
  private readonly id: string;
  private email: string;
  private password?: string;
  private firstName: string;
  private lastName?: string;
  private avatar?: string;
  private username?: string;
  private authType: AuthType;
  private authProvider?: string;
  private roles: UserRoles[];
  private roleStatus: Record<UserRoles, RoleStatus>;
  private status: UserStatus;
  private createdAt: Date;
  private updatedAt: Date;
  private lastLogin: Date;

  private constructor(props: UserProps) {
    this.id = props.id;
    this.email = props.email;
    this.password = props.password;
    this.firstName = props.firstName;
    this.lastName = props.lastName;
    this.avatar = props.avatar;
    this.username = props.username;
    this.authType = props.authType;
    this.authProvider = props.authProvider;
    this.roles =
      Array.isArray(props.roles) && props.roles.length > 0 ? props.roles : [UserRoles.STUDENT];

    // Initialize roleStatus defaults
    this.roleStatus = {
      [UserRoles.STUDENT]: RoleStatus.ACTIVE,
      [UserRoles.INSTRUCTOR]: RoleStatus.ACTIVE,
      [UserRoles.ADMIN]: RoleStatus.ACTIVE,
    };
    if (props.roleStatus) {
      Object.assign(this.roleStatus, props.roleStatus);
    }

    this.status = props.status ?? UserStatus.NOT_VERIFIED;
    this.createdAt = props.createdAt ? new Date(props.createdAt) : new Date();
    this.updatedAt = props.updatedAt ? new Date(props.updatedAt) : new Date();
    this.lastLogin = props.lastLogin ? new Date(props.lastLogin) : new Date();
  }

  public static create(props: UserProps): User {
    return new User(props);
  }

  public static fromPrimitive(props: UserProps): User {
    return new User({ ...props });
  }

  public isBlocked(): boolean {
    return this.status === UserStatus.BLOCKED;
  }

  public isRoleBlocked(role: UserRoles): boolean {
    return this.roleStatus[role] === RoleStatus.BLOCKED;
  }

  public isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  public isVerified(): boolean {
    return this.status === UserStatus.VERIFIED;
  }

  public isNotVerified(): boolean {
    return this.status === UserStatus.NOT_VERIFIED;
  }

  public isNotActive(): boolean {
    return this.status === UserStatus.NOT_ACTIVE;
  }

  public isInstructor(): boolean {
    return this.roles.includes(UserRoles.INSTRUCTOR);
  }

  public isAdmin(): boolean {
    return this.roles.includes(UserRoles.ADMIN);
  }

  public isStudent(): boolean {
    return this.roles.includes(UserRoles.STUDENT);
  }

  public isEmailAuth(): boolean {
    return this.authType === AuthType.EMAIL;
  }

  public isOAuth(): boolean {
    return this.authType === AuthType.OAUTH;
  }

  public login(): boolean {
    if (this.isBlocked()) {
      return false;
    }
    // If student role is blocked uniquely,
    if (this.status !== UserStatus.ACTIVE) {
      this.status = UserStatus.ACTIVE;
    }
    this.lastLogin = new Date();
    this.touch();
    return true;
  }

  /**
   * Perform a logout: set NOT_ACTIVE, update time
   */
  public logout(): void {
    if (this.isBlocked()) {
      return;
    }
    this.status = UserStatus.NOT_ACTIVE;
    this.touch();
  }

  public syncRolesAndStatus(payload: {
    roles?: UserRoles[];
    roleStatus?: Partial<Record<UserRoles, RoleStatus>>;
    status?: UserStatus;
  }): void {
    if (payload.roles) {
      this.roles = payload.roles;
    }
    if (payload.roleStatus) {
      this.roleStatus = { ...this.roleStatus, ...payload.roleStatus } as Record<
        UserRoles,
        RoleStatus
      >;
    }
    if (payload.status) {
      if (this.status !== payload.status) {
        this.status =
          payload.status === UserStatus.BLOCKED ? UserStatus.BLOCKED : UserStatus.ACTIVE;
      }
    }
    this.touch();
  }

  /**
   * Block an entire account
   */
  public block(): void {
    if (this.status !== UserStatus.BLOCKED) {
      this.status = UserStatus.BLOCKED;
      this.touch();
    }
  }

  public unblock(): void {
    if (this.status === UserStatus.BLOCKED) {
      this.status = UserStatus.ACTIVE;
      this.touch();
    }
  }

  public blockRole(role: UserRoles): void {
    if (this.roleStatus[role] !== RoleStatus.BLOCKED) {
      this.roleStatus[role] = RoleStatus.BLOCKED;
      this.touch();
    }
  }

  public unblockRole(role: UserRoles): void {
    if (this.roleStatus[role] === RoleStatus.BLOCKED) {
      this.roleStatus[role] = RoleStatus.ACTIVE;
      this.touch();
    }
  }

  /**
   * Transition user status to VERIFIED if rules allow
   */
  public verify(): void {
    if (this.status !== UserStatus.VERIFIED && !this.isBlocked()) {
      this.status = UserStatus.VERIFIED;
      this.touch();
    }
  }

  /**
   * Set the user status to ACTIVE, if rules allow.
   * Updates last login time and touches the user.
   */
  public activate(): void {
    if (this.isBlocked()) {
      throw new Error('Blocked user cannot be activated.');
    }
    if (this.status !== UserStatus.ACTIVE) {
      this.status = UserStatus.ACTIVE;
      this.lastLogin = new Date();
      this.touch();
    }
  }

  /**
   * Set the user status to NOT_ACTIVE, if rules allow.
   */
  public deactivate(): void {
    if (this.isBlocked()) {
      throw new Error('Blocked user cannot be deactivated.');
    }
    if (this.status !== UserStatus.NOT_ACTIVE) {
      this.status = UserStatus.NOT_ACTIVE;
      this.touch();
    }
  }

  /**
   * Set the user status to NOT_VERIFIED, if rules allow.
   */
  public markNotVerified(): void {
    if (this.isBlocked()) {
      throw new Error('Blocked user cannot be marked as not-verified.');
    }
    if (this.status !== UserStatus.NOT_VERIFIED) {
      this.status = UserStatus.NOT_VERIFIED;
      this.touch();
    }
  }

  public promoteInstructor(): void {
    if (this.isInstructor()) {
      return;
    }
    this.roles.push(UserRoles.INSTRUCTOR);
    this.touch();
  }

  /**
   * Change user role with domain constraints.
   * - Cannot demote admin to student directly, must go through intermediary role.
   * @deprecated Use specific role setter methods instead of changeRole for role updates.
   */
  public changeRole(newRole: UserRoles): void {
    if (this.roles.includes(newRole)) return;

    if (this.isAdmin() && newRole === UserRoles.STUDENT) {
      throw new Error('Cannot demote ADMIN to STUDENT directly.');
    }
    // Legacy support: if changing role, replace entirely or just append depending on business logic. Default to replacing.
    this.roles = [newRole];
    this.touch();
  }

  /**
   * Update user profile details, no arbitrary mutation
   */
  public updateProfile(details: {
    firstName?: string;
    lastName?: string;
    username?: string;
    avatar?: string;
  }): void {
    let anyUpdated = false;
    if (details.firstName && this.firstName !== details.firstName) {
      this.firstName = details.firstName;
      anyUpdated = true;
    }
    if (details.lastName !== undefined && this.lastName !== details.lastName) {
      this.lastName = details.lastName;
      anyUpdated = true;
    }
    if (details.username !== undefined && this.username !== details.username) {
      this.username = details.username;
      anyUpdated = true;
    }
    if (details.avatar !== undefined && this.avatar !== details.avatar) {
      this.avatar = details.avatar;
      anyUpdated = true;
    }
    if (anyUpdated) {
      this.touch();
    }
  }

  /**
   * Change user password with domain validation
   */
  public changePassword(newPassword: string): void {
    if (!newPassword || newPassword === this.password) return;
    this.password = newPassword;
    this.touch();
  }

  private touch(): void {
    this.updatedAt = new Date();
  }

  /**
   * Change authentication type - only as domain allows.
   */
  public changeAuthType(type: AuthType): void {
    if (this.authType !== type) {
      this.authType = type;
      this.touch();
    }
  }

  public getId(): string {
    return this.id;
  }

  public getFullName(): string {
    return this.username ?? this.firstName + ' ' + this.lastName;
  }
  public getEmail(): string {
    return this.email;
  }
  public getPassword(): string | undefined {
    return this.password;
  }
  public getFirstName(): string {
    return this.firstName;
  }
  public getLastName(): string | undefined {
    return this.lastName;
  }
  public getAvatar(): string | undefined {
    return this.avatar;
  }
  public getUsername(): string | undefined {
    return this.username;
  }
  public getAuthType(): AuthType {
    return this.authType;
  }
  public getAuthProvider(): string | undefined {
    return this.authProvider;
  }
  public getRoles(): UserRoles[] {
    return [...this.roles];
  }
  public getRoleStatusMap(): Record<UserRoles, RoleStatus> {
    return { ...this.roleStatus };
  }

  public getStatus(): UserStatus {
    return this.status;
  }
  public getCreatedAt(): Date {
    return this.createdAt;
  }
  public getUpdatedAt(): Date {
    return this.updatedAt;
  }
  public getLastLogin(): Date {
    return this.lastLogin;
  }

  public _setTimestampsForPersistence(props: {
    createdAt?: Date;
    updatedAt?: Date;
    lastLogin?: Date;
  }): void {
    if (props.createdAt) this.createdAt = props.createdAt;
    if (props.updatedAt) this.updatedAt = props.updatedAt;
    if (props.lastLogin) this.lastLogin = props.lastLogin;
  }
}

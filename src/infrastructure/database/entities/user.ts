import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { RefreshTokenEntity } from './refresh-token';
import { PasswordResetEntity } from './password-reset-tokens';
import { AuthType, UserRoles, UserStatus } from '@/domain/entity/user';

@Entity('auth_users')
export default class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ unique: true, nullable: false })
  email!: string;

  @Column({ nullable: true })
  password!: string;

  @Column({ type: 'varchar', nullable: false })
  firstName!: string;

  @Column({ type: 'varchar', nullable: true })
  lastName?: string | undefined;

  @Column({ type: 'varchar', nullable: true, unique: true })
  username?: string | undefined;

  @Column({ type: 'varchar', nullable: true })
  authProvider?: string | undefined;

  @Index()
  @Column({
    type: 'enum',
    enum: UserRoles,
    array: true,
    default: [UserRoles.STUDENT],
  })
  roles!: UserRoles[];

  @Column({ type: 'jsonb', default: {} })
  roleStatus!: Record<UserRoles, string>;

  @Column({
    type: 'enum',
    enum: AuthType,
    nullable: true,
  })
  authType!: AuthType;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @CreateDateColumn()
  createdAt: Date;

  @Column('timestamp with time zone')
  lastLogin: Date;

  @Column({ type: 'varchar', nullable: true })
  avatar?: string | undefined;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => RefreshTokenEntity, (refreshToken) => refreshToken.user, { cascade: true })
  refreshTokens!: RefreshTokenEntity[];

  @OneToMany(() => PasswordResetEntity, (resetEntity) => resetEntity.user, { cascade: true })
  resetToken!: PasswordResetEntity[];
}

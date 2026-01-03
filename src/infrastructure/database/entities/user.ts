import { AuthType, UserRoles } from '@/shared/types/user-types';
import { UserStatus } from '@/shared/types/user-status';
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
    default: UserRoles.STUDENT,
  })
  role!: UserRoles;

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

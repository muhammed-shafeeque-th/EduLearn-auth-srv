import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsEnum,
  IsString,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { AuthType, UserRoles } from '@/shared/types/user-types';

export default class RegisterUserDto {
  @IsEmail({}, { message: 'Invalid email format' })
  email!: string;

  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password!: string;

  // @IsNotEmpty({ message: 'Avatar is required' })
  @IsString({ message: 'Avatar must be a valid string' })
  @IsOptional()
  avatar?: string;

  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(3, { message: 'Name must be at least 3 characters long' })
  firstName: string;

  @IsOptional({ message: 'Name is required' })
  @MinLength(3, { message: 'Name must be at least 3 characters long' })
  lastName?: string;

  @IsEnum(UserRoles, { message: 'Role must be one of the valid user roles' })
  role: UserRoles;

  @IsEnum(AuthType, { message: 'AuthType must be one of the valid auth types' })
  authType: AuthType;

  static create(dto: {
    email: string;
    password: string;
    avatar?: string;
    firstName: string;
    lastName?: string;
    role: UserRoles;
    authType: AuthType;
  }) {
    const authDto = new RegisterUserDto();
    authDto.avatar = dto.avatar;
    authDto.email = dto.email;
    authDto.password = dto.password;
    authDto.firstName = dto.firstName;
    authDto.lastName = dto.lastName;
    authDto.role = dto.role;
    authDto.authType = dto.authType;
    return authDto;
  }
}

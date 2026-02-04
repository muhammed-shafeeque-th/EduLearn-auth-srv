import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export default class LoginUserDto {
  @IsEmail({}, { message: 'Invalid email format' })
  email!: string;

  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @IsOptional()
  password!: string;

  @IsBoolean({ message: 'remember must be type of boolean' })
  @IsOptional()
  rememberMe: boolean;

  static create(dto: { email: string; password: string; rememberMe: boolean }) {
    const authDto = new LoginUserDto();
    authDto.email = dto.email;
    authDto.password = dto.password;
    authDto.rememberMe = dto.rememberMe;

    return authDto;
  }
}

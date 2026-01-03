import { IsEmail, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export default class AdminLoginDto {
  @IsEmail({}, { message: 'Invalid email format' })
  email!: string;

  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @IsOptional()
  password!: string;

  static create(dto: { email: string; password: string }) {
    const authDto = new AdminLoginDto();
    authDto.email = dto.email;
    authDto.password = dto.password;

    return authDto;
  }
}

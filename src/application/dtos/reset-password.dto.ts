import { ResetPasswordRequest } from '@/infrastructure/gRPC/generated/auth_service';
import { IsNotEmpty, IsString, Min } from 'class-validator';

export default class ResetPasswordDto implements ResetPasswordRequest {
  @IsString({ message: 'token must be string' })
  @IsNotEmpty()
  token: string;

  @IsString({ message: '`password` must be string' })
  @IsNotEmpty()
  password: string;

  @IsString({ message: '`confirmPassword` must be string' })
  @IsNotEmpty()
  confirmPassword: string;

  static create(dto: { token: string; password: string; confirmPassword: string }) {
    const authDto = new ResetPasswordDto();
    authDto.token = dto.token;
    authDto.password = dto.password;
    authDto.confirmPassword = dto.confirmPassword;

    return authDto;
  }
}

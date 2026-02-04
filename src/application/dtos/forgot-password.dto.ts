import { IsEmail, IsString } from 'class-validator';

export default class ForgotPasswordDto {
  @IsString({ message: 'userId must be string' })
  @IsEmail()
  email: string;

  static create(dto: { email: string }) {
    const authDto = new ForgotPasswordDto();
    authDto.email = dto.email;

    return authDto;
  }
}

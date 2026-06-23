import { IsEmail } from 'class-validator';

export default class VerifyUserDto {
  @IsEmail({}, { message: 'Invalid email format' })
  email!: string;

  static create(dto: { email: string }) {
    const authDto = new VerifyUserDto();
    authDto.email = dto.email;

    return authDto;
  }
}

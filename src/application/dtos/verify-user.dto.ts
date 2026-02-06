import { IsEmail } from 'class-validator';
import { IUser } from '@/domain/interfaces/user';

export default class VerifyUserDto implements Partial<IUser> {
  @IsEmail({}, { message: 'Invalid email format' })
  email!: string;

  static create(dto: { email: string }) {
    const authDto = new VerifyUserDto();
    authDto.email = dto.email;

    return authDto;
  }
}

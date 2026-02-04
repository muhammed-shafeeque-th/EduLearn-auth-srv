import { IsString } from 'class-validator';

export default class ChangePasswordDto {
  @IsString({ message: 'userId must be string' })
  userId: string;

  @IsString({ message: '`oldPassword` must be string' })
  oldPassword: string;

  @IsString({ message: '`newPassword` must be string' })
  // @Min(6, { message: '`newPassword` must be 6 character long ' })
  newPassword: string;

  static create(dto: { userId: string; oldPassword: string; newPassword: string }) {
    const authDto = new ChangePasswordDto();
    authDto.userId = dto.userId;
    authDto.oldPassword = dto.oldPassword;
    authDto.newPassword = dto.newPassword;

    return authDto;
  }
}

import { IsNotEmpty } from 'class-validator';

export default class RefreshTokenDto {
  @IsNotEmpty({ message: 'Token required' })
  refreshToken!: string;

  static create(dto: { refreshToken: string }) {
    const authDto = new RefreshTokenDto();
    authDto.refreshToken = dto.refreshToken;

    return authDto;
  }
}

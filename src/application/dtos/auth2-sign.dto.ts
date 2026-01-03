import { IsNotEmpty, IsEnum, IsString } from 'class-validator';
import { AuthType } from '@/shared/types/user-types';
import { Auth2SignRequest } from '@/infrastructure/gRPC/generated/auth_service';

export default class Auth2SignDto implements Auth2SignRequest {
  @IsNotEmpty({ message: 'Token is required' })
  @IsString({ message: 'Token must be a valid string' })
  token: string;

  @IsNotEmpty({ message: 'Provider is required' })
  provider: string;

  @IsEnum(AuthType, { message: 'AuthType must be one of the valid auth types' })
  authType: AuthType;

  static create(dto: { token: string; provider: string; authType: AuthType }) {
    const authDto = new Auth2SignDto();
    authDto.token = dto.token;
    authDto.provider = dto.provider;
    authDto.authType = dto.authType;
    return authDto;
  }
}

import { AuthType } from '@/domain/entity/user';

export const mapToAuthType = (type: string) => {
  switch (type) {
    case AuthType.EMAIL:
      return AuthType.EMAIL;
    case AuthType.OAUTH:
      return AuthType.OAUTH;
    default:
      throw Error('Invalid auth type');
  }
};

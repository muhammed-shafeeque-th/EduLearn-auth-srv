import { AuthType } from '../types/user-types';

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

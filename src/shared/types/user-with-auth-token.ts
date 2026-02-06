import { IAuthTokens } from './auth.tokens';
import User from '@/domain/entity/user';

export interface IUserWithAuthToken extends IAuthTokens {
  user: User;
}

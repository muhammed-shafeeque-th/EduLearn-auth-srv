import IAuthProviderStrategy from '@/application/services/auth-provider.strategy';
import { injectable } from 'inversify';
import IAuthProviderContext, { AuthProvider } from '@/application/services/auth-provider.service';
import GoogleAuthProviderImpl from './google-auth-provider';

@injectable()
export default class AuthProviderContextImpl implements IAuthProviderContext {
  public execute(provider: AuthProvider): IAuthProviderStrategy {
    switch (provider) {
      case 'google':
        return new GoogleAuthProviderImpl();
      case 'facebook':
      case 'github':
      default:
        throw new Error("Have'nt implemented providers other than Google");
    }
  }
}

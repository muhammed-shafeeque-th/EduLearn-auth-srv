import IAuthProviderStrategy from './auth-provider.strategy';

export default interface IAuthProviderContext {
  execute(provider: AuthProvider): IAuthProviderStrategy;
}

export type AuthProvider = 'google' | 'facebook' | 'github';

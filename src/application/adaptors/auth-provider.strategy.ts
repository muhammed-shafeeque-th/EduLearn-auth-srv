/**
 * Interface for a IAuthProviderStrategy which can implement various strategies.
 */
export default interface IAuthProviderStrategy {
  /**
   * Process specific auth provider logic by validate provider's access token and populate use data .
   * @param token Access token issued by auth provider
   * @returns { IOAuthData } - Populated data from the auth provider.
   */
  execute(token: string): Promise<IOAuthData>;
}

export type IOAuthData = {
  username: string;
  email: string;
  image?: string;
};

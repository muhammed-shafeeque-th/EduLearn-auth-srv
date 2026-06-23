import IAuthProviderStrategy, { IOAuthData } from '@/application/adaptors/auth-provider.strategy';
import { OAuth2Client } from 'google-auth-library';
import { getEnvs } from '@/shared/utils/getEnv';
import BadRequestError from '@/shared/errors/bad-request.error';
import { AuthenticationError } from '@/shared/errors/auth.error';

const { GOOGLE_CLIENT_ID: googleClientId } = getEnvs({ GOOGLE_CLIENT_ID: '' });

export default class GoogleAuthProviderImpl implements IAuthProviderStrategy {
  private _client: OAuth2Client; // Initialize the Google Auth client for token verification

  public constructor() {
    this._client = new OAuth2Client(googleClientId.toString());
  }
  public execute = async (token: string): Promise<IOAuthData> => {
    try {
      // VERIFY THE GOOGLE TOKEN
      const ticket = await this._client.verifyIdToken({
        idToken: token,
        audience: googleClientId.toString(),
      });

      const payload = ticket.getPayload();

      if (!payload?.email || !payload?.name) {
        throw new BadRequestError('Invalid Google token: No user payload found.');
      }

      return {
        email: payload.email,
        image: payload.picture,
        username: payload.name,
      };
    } catch (error) {
      throw new AuthenticationError((error as Error)?.message || 'google token validation error');
    }
  };
}

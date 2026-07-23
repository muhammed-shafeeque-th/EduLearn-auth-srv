import { RefreshToken } from '@/domain/entity/refresh-token';

describe('RefreshToken', () => {
  const FAKE_ID = 'token-1';
  const FAKE_USER_ID = 'user-123';
  const FAKE_TOKEN = 'sometokenvalue';
  const NOW = new Date();
  const ONE_HOUR_LATER = new Date(NOW.getTime() + 60 * 60 * 1000);

  it('should create a refresh token with correct properties', () => {
    // Arrange
    const id = FAKE_ID;
    const userId = FAKE_USER_ID;
    const token = FAKE_TOKEN;
    const expiresAt = ONE_HOUR_LATER;
    const isRememberMe = true;
    const revoked = false;

    // Act
    const refreshToken = new RefreshToken(id, userId, token, expiresAt, isRememberMe, revoked);

    // Assert
    expect(refreshToken.id).toBe(id);
    expect(refreshToken.userId).toBe(userId);
    expect(refreshToken.token).toBe(token);
    expect(refreshToken.expiresAt).toEqual(expiresAt);
    expect(refreshToken.isRememberMe).toBe(true);
    expect(refreshToken.revoked).toBe(false);
    expect(refreshToken.createdAt).toBeInstanceOf(Date);
  });

  it('should default isRememberMe and revoked to false if not provided', () => {
    // Arrange
    const id = FAKE_ID;
    const userId = FAKE_USER_ID;
    const token = FAKE_TOKEN;
    const expiresAt = ONE_HOUR_LATER;

    // Act
    const refreshToken = new RefreshToken(id, userId, token, expiresAt);

    // Assert
    expect(refreshToken.isRememberMe).toBe(false);
    expect(refreshToken.revoked).toBe(false);
  });

  it('should set revoked to true when markAsRevoked is called', () => {
    // Arrange
    const refreshToken = new RefreshToken(FAKE_ID, FAKE_USER_ID, FAKE_TOKEN, ONE_HOUR_LATER);

    // Act
    refreshToken.markAsRevoked();

    // Assert
    expect(refreshToken.revoked).toBe(true);
  });
});

import { IRefreshToken } from '../interfaces/refresh-token';

export class RefreshToken implements IRefreshToken {
  public createdAt: Date;
  public constructor(
    public readonly id: string,
    public userId: string,
    public token: string,
    public expiresAt: Date,
    public isRememberMe: boolean = false,
    public revoked: boolean = false,
  ) {
    this.createdAt = new Date();
  }

  public markAsRevoked(): void {
    this.revoked = true;
  }
}

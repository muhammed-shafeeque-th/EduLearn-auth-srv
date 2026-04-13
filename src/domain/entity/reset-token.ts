import InvalidTokenError from '@/domain/errors/invalid-token.error';

export class ResetToken {
  public createdAt: Date;
  public constructor(
    public readonly id: string,
    public userId: string,
    public token: string,
    public expiresAt: Date,
    public isUsed: boolean = false,
  ) {
    this.createdAt = new Date();
  }

  public markAsUsed(): void {
    this.isUsed = true;
  }

  public validate(): void {
    if (this.isUsed) {
      throw new InvalidTokenError(
        'Reset token already used or token expired, please try again later',
      );
    }

    if (new Date() > this.expiresAt) {
      throw new InvalidTokenError(`Reset token expired, try to request for another token`);
    }
  }
}

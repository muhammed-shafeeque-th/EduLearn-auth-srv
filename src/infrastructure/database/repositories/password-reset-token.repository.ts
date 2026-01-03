import { LessThan, Repository } from 'typeorm';
import { AppDataSource } from '../data-source/data-source';
import { injectable } from 'inversify';
import User from '@/domain/entity/user';
import { IPasswordResetTokenRepository } from '@/domain/repository/reset-token.repository ';
import { PasswordResetEntity } from '../entities/password-reset-tokens';
import { ResetToken } from '@/domain/entity/reset-token';

@injectable()
export default class PasswordResetRepositoryImpl implements IPasswordResetTokenRepository {
  private repo: Repository<PasswordResetEntity>;
  public constructor() {
    this.repo = AppDataSource.getRepository(PasswordResetEntity);
  }

  public async createToken(token: ResetToken): Promise<void> {
    await this.repo.save(token);
  }

  public async findById(id: string): Promise<ResetToken | null> {
    const result = await this.repo.findOne({
      where: {
        id: id,
      },
    });

    return result ? this.mapToDomain(result) : null;
  }

  public async findUserByToken(token: string): Promise<{ user: User; token: ResetToken } | null> {
    const refreshToken = await this.repo.findOne({
      where: {
        token,
        // isUsed: false,
        // expiresAt: MoreThan(new Date()),
      },
      relations: ['user'],
    });
    return refreshToken ? this.mapToDomainWithUser(refreshToken) : null;
  }

  public async updateToken(tokenId: string, token: Partial<ResetToken>): Promise<void> {
    await this.repo.update(tokenId, token);
  }

  public async deleteExpiredAndUsedTokens(): Promise<void> {
    await this.repo.delete({
      isUsed: true,
      expiresAt: LessThan(new Date()),
    });
  }
  private mapToDomainWithUser(token: PasswordResetEntity): { user: User; token: ResetToken } {
    const { user } = token;

    const userDomain = User.fromPrimitive({
      id: user.id,
      email: user.email,
      authType: user.authType,
      firstName: user.firstName,
      password: user.password,
      lastName: user.lastName,
      avatar: user.avatar,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: user.lastLogin,
    });

    const restToken = this.mapToDomain(token);
    return {
      token: restToken,
      user: userDomain,
    };
  }

  private mapToDomain(token: PasswordResetEntity): ResetToken {
    const restToken = new ResetToken(
      token.id,
      token.userId,
      token.token,
      token.expiresAt,
      token.isUsed,
    );
    restToken.createdAt = token.createdAt;
    return restToken;
  }
}

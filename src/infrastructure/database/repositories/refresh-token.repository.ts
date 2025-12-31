import { IRefreshTokenRepository } from '@/domain/repository/refresh-token.repository';
import { MoreThan, LessThan, Repository } from 'typeorm';
import { RefreshTokenEntity } from '../entities/refresh-token';
import { AppDataSource } from '../data-source/data-source';
import { IRefreshToken } from '@/domain/interfaces/refresh-token';
import { injectable } from 'inversify';
import User from '@/domain/entity/user';
import { RefreshToken } from '@/domain/entity/refresh-token';

@injectable()
export default class RefreshTokenRepositoryImpl implements IRefreshTokenRepository {
  private repo: Repository<RefreshTokenEntity>;
  public constructor() {
    this.repo = AppDataSource.getRepository(RefreshTokenEntity);
  }

  public async upsertToken(token: RefreshToken): Promise<void> {
    await this.repo.upsert(token, { conflictPaths: ['id'] });
  }

  public async findByUserId(userId: string): Promise<RefreshToken | null> {
    const result = await this.repo.findOne({
      where: {
        userId: userId,
      },
    });

    return result ? this.mapToDomain(result) : null;
  }

  public async findUserByToken(token: string): Promise<{ user: User; token: RefreshToken } | null> {
    const refreshToken = await this.repo.findOne({
      where: {
        token,
        revoked: false,
        expiresAt: MoreThan(new Date()),
      },
      relations: ['user'],
    });
    return refreshToken ? this.mapToDomainWithUser(refreshToken) : null;
  }

  public async updateToken(userId: string, token: Partial<IRefreshToken>): Promise<void> {
    await this.repo.update(userId, token);
  }

  public async deleteExpiredAndRevokedTokens(): Promise<void> {
    await this.repo.delete({
      revoked: true,
      expiresAt: LessThan(new Date()),
    });
  }
  private mapToDomainWithUser(token: RefreshTokenEntity): { user: User; token: RefreshToken } {
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
      authProvider: user.authProvider,
      role: user.role,
      status: user.status,
      username: user.username,
    });

    return {
      token: new RefreshToken(
        token.id,
        token.userId,
        token.token,
        token.expiresAt,
        token.isRemember,
        token.revoked,
      ),
      user: userDomain,
    };
  }

  private mapToDomain(token: RefreshTokenEntity): RefreshToken {
    return new RefreshToken(
      token.id,
      token.userId,
      token.token,
      token.expiresAt,
      token.isRemember,
      token.revoked,
    );
  }
}

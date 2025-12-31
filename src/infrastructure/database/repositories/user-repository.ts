import { Repository } from 'typeorm';
import { AppDataSource } from '@/infrastructure/database/data-source/data-source';
import UserModel from '@/infrastructure/database/entities/user';
import User from '@/domain/entity/user';
import { UserRoles } from '@/shared/types/user-types';
import { UserStatus } from '@/shared/types/user-status';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/shared/constants/identifiers';
import { TracingService } from '@/infrastructure/observability/tracing/trace.service';
import { LoggingService } from '@/infrastructure/observability/logging/logging.service';
import { MetricsService } from '@/infrastructure/observability/monitoring/monitoring.service';
import IAuthUserRepository from '@/domain/repository/user.repository';
import { ICacheService } from '@/application/services/cache.service';

@injectable()
export default class PostgresAuthUserRepositoryImpl implements IAuthUserRepository {
  private readonly repo: Repository<UserModel>;

  public constructor(
    @inject(TYPES.TracingService)
    private readonly tracer: TracingService,
    @inject(TYPES.MetricsService)
    private readonly metrics: MetricsService,
    @inject(TYPES.LoggingService)
    private readonly logger: LoggingService,
    @inject(TYPES.ICacheService)
    private readonly cache: ICacheService,
    // repo?: Repository<UserModel>,
  ) {
    // Dependency injection fallback for easier testability and singletons.
    this.repo = AppDataSource.getRepository(UserModel);
  }

  public async create(user: User): Promise<User> {
    return this.tracer.startActiveSpan('PostgresUserRepository.create', async (span) => {
      span.setAttributes({
        'db.operation': 'insert',
        'user.email': user.getEmail(),
      });

      this.logger.debug(`Creating user in database with email: ${user.getEmail()}`);
      try {
        const ormUser = this.mapToEntity(user);
        const newUser = this.repo.create(ormUser);
        const savedUser = await this.repo.save(newUser);

        if (savedUser) {
          this.logger.debug(`User created successfully with ID: ${savedUser.id}`);
          span.setAttribute('User.created', true);
          // Invalidate relevant caches in parallel
          await Promise.allSettled([
            this.cache.delete(`db:user:${savedUser.id}`),
            this.cache.delete(`db:user:email:${savedUser.email}`),
          ]);
        } else {
          this.logger.error(`Failed to create user with email: ${user.getEmail()}`);
          span.setAttribute('User.created', false);
          throw new Error('Could not create user');
        }
        return this.mapToDomain(savedUser);
      } catch (error) {
        this.logger.error(`Error creating user with email: ${user.getEmail()}`, { error });
        this.tracer.recordException(span, error);
        throw error;
      }
    });
  }

  public async findById(userId: string): Promise<User | null> {
    return this.tracer.startActiveSpan('PostgresUserRepository.findById', async (span) => {
      span.setAttributes({
        'db.operation': 'select',
        'user.id': userId,
      });

      this.logger.debug(`Fetching user from database with ID: ${userId}`);
      try {
        // Check cache first (read-through)
        const cacheKey = `db:user:${userId}`;
        const cachedUser = await this.cache.get<UserModel>(cacheKey);
        if (cachedUser) {
          this.logger.debug(`Cache hit for user: ${userId}`);
          span.setAttribute('cache.hit', true);
          return this.mapToDomain(cachedUser);
        }

        this.logger.debug(`Cache miss for user: ${userId}`);
        span.setAttribute('cache.hit', false);

        const endTimer = this.metrics.measureDBOperationDuration('findById', 'SELECT');
        this.metrics.incrementDBRequestCounter('SELECT');
        const user = await this.repo.findOne({ where: { id: userId } });
        endTimer();

        if (user) {
          this.logger.debug(`User found in DB with ID: ${userId}`);
          span.setAttribute('User.found', true);
          // Cache result, optionally a TTL could be added
          await this.cache.set(cacheKey, user, 3600);
        } else {
          this.logger.debug(`User not found in DB with ID: ${userId}`);
          span.setAttribute('User.found', false);
        }
        return user ? this.mapToDomain(user) : null;
      } catch (error) {
        this.logger.error(`Error fetching user with ID: ${userId}`, { error });
        this.tracer.recordException(span, error);
        throw error;
      }
    });
  }

  public async findByEmail(email: string): Promise<User | null> {
    return this.tracer.startActiveSpan('PostgresUserRepository.findByEmail', async (span) => {
      span.setAttributes({
        'db.operation': 'select',
        'user.email': email,
      });
      this.logger.debug(`Fetching user from database with email: ${email}`);
      try {
        const cacheKey = `db:user:email:${email}`;
        const cachedUser = await this.cache.get<UserModel>(cacheKey);
        if (cachedUser) {
          this.logger.debug(`Cache hit for user with email: ${email}`);
          span.setAttribute('cache.hit', true);
          return this.mapToDomain(cachedUser);
        }
        this.logger.debug(`Cache miss for user with email: ${email}`);
        span.setAttribute('cache.hit', false);

        const endTimer = this.metrics.measureDBOperationDuration('findByEmail', 'SELECT');
        this.metrics.incrementDBRequestCounter('SELECT');
        const user = await this.repo.findOne({ where: { email } });
        endTimer();

        if (user) {
          this.logger.debug(`User found in DB with email: ${email}`);
          span.setAttribute('User.found', true);
          // Cache can be set with TTL (default 3600s = 1 hour)
          await this.cache.set(cacheKey, user, 3600);
        } else {
          this.logger.debug(`User not found in DB with email: ${email}`);
          span.setAttribute('User.found', false);
        }
        return user ? this.mapToDomain(user) : null;
      } catch (error) {
        this.logger.error(`Error fetching user with email: ${email}`, { error });
        this.tracer.recordException(span, error);
        throw error;
      }
    });
  }

  public async delete(userId: string): Promise<void> {
    return this.tracer.startActiveSpan('PostgresUserRepository.delete', async (span) => {
      span.setAttributes({
        'db.operation': 'update', // Actually a soft-delete (status set to BLOCKED)
        'user.id': userId,
      });
      this.logger.debug(`Deleting (blocking) user in database with ID: ${userId}`);
      try {
        const endTimer = this.metrics.measureDBOperationDuration('delete', 'DELETE');
        this.metrics.incrementDBRequestCounter('DELETE');

        // Block user (soft delete), and fetch updated record in parallel
        const [, userRecord] = await Promise.all([
          this.repo.update({ id: userId }, { status: UserStatus.BLOCKED }),
          this.repo.findOne({ where: { id: userId } }),
        ]);
        endTimer();

        const email = userRecord?.email;
        const operations: Promise<unknown>[] = [this.cache.delete(`db:user:${userId}`)];
        if (email) {
          operations.push(this.cache.delete(`db:user:email:${email}`));
        }

        await Promise.allSettled(operations);
        this.logger.debug(`User blocked and caches cleared for ID: ${userId}`);
      } catch (error) {
        this.logger.error(`Error deleting (blocking) user with ID: ${userId}`, { error });
        this.tracer.recordException(span, error);
        throw error;
      }
    });
  }

  public async update(userId: string, data: User): Promise<User | null> {
    return this.tracer.startActiveSpan('PostgresUserRepository.update', async (span) => {
      span.setAttributes({
        'db.operation': 'update',
        'user.id': userId,
      });
      this.logger.debug(`Updating user in database with ID: ${userId}`);
      try {
        // We only update non-undefined properties (avoid overwriting columns with undefined)
        const modelData = this.mapToEntity(data);

        const endTimer = this.metrics.measureDBOperationDuration('update', 'UPDATE');
        this.metrics.incrementDBRequestCounter('UPDATE');
        await this.repo.update({ id: userId }, modelData);
        const updatedUser = await this.repo.findOne({ where: { id: userId } });
        endTimer();

        if (updatedUser) {
          this.logger.debug(`User updated successfully with ID: ${userId}`);
          span.setAttribute('User.updated', true);
          // Invalidate relevant caches
          await Promise.allSettled([
            this.cache.delete(`db:user:${userId}`),
            this.cache.delete(`db:user:email:${updatedUser.email}`),
          ]);
        } else {
          this.logger.error(`Failed to update user with ID: ${userId}`);
          span.setAttribute('User.updated', false);
        }
        return updatedUser ? this.mapToDomain(updatedUser) : null;
      } catch (error) {
        this.logger.error(`Error updating user with ID: ${userId}`, { error });
        this.tracer.recordException(span, error);
        throw error;
      }
    });
  }

  /**
   * Map ORM model to domain entity.
   */
  private mapToDomain(user: UserModel): User {
    return User.fromPrimitive({
      id: user.id,
      email: user.email,
      authType: user.authType,
      firstName: user.firstName!,
      password: user.password,
      lastName: user.lastName,
      authProvider: user.authProvider,
      avatar: user.avatar,
      username: user.username,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: user.lastLogin,
      role: user.role,
      status: user.status,
    });
  }

  /**
   * Map domain entity to ORM model. All fields present in domain object are overwritten.
   */
  private mapToEntity(user: User): UserModel {
    const ormEntity = new UserModel();
    ormEntity.id = user.getId();
    ormEntity.email = user.getEmail();
    ormEntity.username = user.getUsername();
    ormEntity.password = user.getPassword()!;
    ormEntity.firstName = user.getFirstName();
    ormEntity.lastName = user.getLastName();
    ormEntity.avatar = user.getAvatar?.();
    ormEntity.authProvider = user.getAuthProvider?.();
    ormEntity.createdAt = user.getCreatedAt?.();
    ormEntity.updatedAt = user.getUpdatedAt?.();
    ormEntity.lastLogin = user.getLastLogin?.();
    ormEntity.authType = user.getAuthType?.();
    ormEntity.role = user.getRole?.() as UserRoles;
    ormEntity.status = user.getStatus?.() as UserStatus;

    return ormEntity;
  }
}

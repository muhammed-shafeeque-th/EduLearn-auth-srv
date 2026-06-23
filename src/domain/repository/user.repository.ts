import User from '../entity/user';

export default interface IAuthUserRepository {
  /**
   * Finds a user by their ID.
   * @param userId - The ID of the user to find.
   * @returns A promise that resolves to the user if found, or null if not found.
   */
  findById(userId: string): Promise<User | null>;

  /**
   * Finds a user by their email.
   * @param email - The email of the user to find.
   * @returns A promise that resolves to the user if found, or null if not found.
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Deletes a user by their ID.
   * @param userId - The ID of the user to delete.
   * @returns A promise that resolves when the user is deleted.
   */
  delete(userId: string): Promise<void>;

  /**
   * Updates a user by their ID.
   * @param userId - The ID of the user to update.
   * @param data - The data to update the user with.
   * @returns A promise that resolves to the updated user if successful, or null if not found.
   */
  update(userId: string, data: Partial<User>): Promise<User | null>;

  /**
   * Creates a new user.
   * @param user - The user to create.
   * @returns A promise that resolves to the created user.
   */
  create(user: User): Promise<User>;
}

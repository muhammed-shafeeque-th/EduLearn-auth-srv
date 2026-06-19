export default interface IHashService {
  /**
   * Hashes the given password.
   *
   * @param password - The password to be hashed.
   * @returns A promise that resolves to the hashed password as a string.
   */
  hash(password: string): Promise<string>;

  /**
   * Compares a given password with a hashed password.
   *
   * @param oldPassword - The original password to compare.
   * @param newPassword - The hashed password to compare against.
   * @returns A promise that resolves to a boolean indicating whether the passwords match.
   */
  compare(oldPassword: string, newPassword: string): Promise<boolean>;
}

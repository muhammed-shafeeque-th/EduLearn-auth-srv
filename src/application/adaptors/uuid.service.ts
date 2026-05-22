/**
 * Interface for a UUID service that provides functionality to generate unique identifiers.
 */
export default interface IUUIDService {
  /**
   * Generates a new universally unique identifier (UUID).
   *
   * @returns {string} A string representation of the generated UUID.
   */
  generate(): string;
}

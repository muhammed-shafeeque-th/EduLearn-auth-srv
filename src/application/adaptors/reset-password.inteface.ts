import ResetPasswordDto from '../dtos/reset-password.dto';

/**
 * Interface representing the use case to fetch all users logged into
 *
 */
export interface IResetPasswordUseCase {
  /**
   * @param token reset token of the User
   * @param password old password  of the User
   * @param confirmPassword password to be changed into
   * @returns A Promise resolve to  an Object containing `userId`
   */
  execute(dto: ResetPasswordDto): Promise<{ userId: string }>;
}

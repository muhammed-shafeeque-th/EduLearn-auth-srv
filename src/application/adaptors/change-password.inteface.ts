import ChangePasswordDto from '@/application/dtos/change-password.dto';

/**
 * Interface representing the use case to fetch all users logged into
 *
 */
export interface IChangePasswordUseCase {
  /**
   * @param userId ID of the User
   * @param oldPassword old password  of the User
   * @param newPassword password to be changed into
   * @returns A Promise resolve to  an Object containing `userId`
   */
  execute(dto: ChangePasswordDto): Promise<{ userId: string }>;
}

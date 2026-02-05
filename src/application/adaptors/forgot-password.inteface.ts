import User from '@/domain/entity/user';
import ForgotPasswordDto from '../dtos/forgot-password.dto';

/**
 * Interface representing the use case to fetch all users logged into
 *
 */
export interface IForgotPasswordUseCase {
  /**
   * @param email email of the User
   * @returns A Promise resolve to  an Object containing `userId`
   */
  execute(dto: ForgotPasswordDto, idempotencyKey: string): Promise<{ user: User; link: string }>;
}

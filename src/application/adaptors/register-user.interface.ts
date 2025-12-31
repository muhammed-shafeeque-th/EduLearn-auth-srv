import RegisterUserDto from '@/application/dtos/register-user.dto';
import User from '@/domain/entity/user';

export default interface IRegisterUserUseCase {
  /**
   * Creates user with given user data and saves in database
   * @param dto - User data transferred from client
   * @returns A promise that resolve to the created user data
   */
  execute(dto: RegisterUserDto): Promise<User>;
}

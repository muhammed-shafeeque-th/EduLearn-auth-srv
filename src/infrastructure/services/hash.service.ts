import IHashService from '@/application/adaptors/hash.service';
import bcrypt from 'bcrypt';
import { injectable } from 'inversify';

@injectable()
export default class HashServiceImpl implements IHashService {
  public readonly SALT_VALUE = 10;

  public async hash(password: string): Promise<string> {
    return await bcrypt.hash(password, this.SALT_VALUE);
  }

  public async compare(oldPassword: string, newPassword: string): Promise<boolean> {
    return await bcrypt.compare(newPassword, oldPassword);
  }
}

import { IPasswordHasherService } from '../../application/services/password-hasher.service.interface';

export class PasswordHasherService implements IPasswordHasherService {
  async hash(value: string): Promise<string> {
    return await Bun.password.hash(value);
  }

  async verify(plainValue: string, hashedValue: string): Promise<boolean> {
    return await Bun.password.verify(plainValue, hashedValue);
  }
}

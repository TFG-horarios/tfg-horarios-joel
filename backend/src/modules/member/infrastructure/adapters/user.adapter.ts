import type {
  IUserProvider,
  UserDTO,
} from '../../domain/providers/user.provider';
import type { IUserRepository } from '@/modules/user/domain/user.repository';

export class UserAdapter implements IUserProvider {
  constructor(private readonly userRepository: IUserRepository) {}

  async getUserByEmail(email: string): Promise<UserDTO | null> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }
}

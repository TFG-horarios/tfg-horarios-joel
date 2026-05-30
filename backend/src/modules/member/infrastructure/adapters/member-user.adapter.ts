import type {
  IMemberUserProvider,
  MemberUserDTO,
} from '../../domain/member-user.provider';
import type { IUserRepository } from '@/modules/user/domain/user.repository';

export class MemberUserAdapter implements IMemberUserProvider {
  constructor(private readonly userRepository: IUserRepository) {}

  async getUserByEmail(email: string): Promise<MemberUserDTO | null> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }
}

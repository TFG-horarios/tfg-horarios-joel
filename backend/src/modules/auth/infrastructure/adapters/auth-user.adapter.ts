import type {
  IAuthUserRepository,
  AuthUserRecord,
  CreateAuthUserRecord,
} from '../../domain/auth-user.provider';
import type { IUserRepository } from '@/modules/user/domain/user.repository';
import { User } from '@/modules/user/domain/user.entity';

export class AuthUserAdapter implements IAuthUserRepository {
  constructor(private readonly userRepository: IUserRepository) {}

  async findByEmail(email: string): Promise<AuthUserRecord | null> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
    };
  }

  async create(userDto: CreateAuthUserRecord): Promise<AuthUserRecord> {
    const user = User.create({
      name: userDto.name,
      email: userDto.email,
      passwordHash: userDto.passwordHash,
    });

    await this.userRepository.create(user);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
    };
  }
}

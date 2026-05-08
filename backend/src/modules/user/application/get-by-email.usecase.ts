import { type IUserRepository } from '../domain/user.repository';
import { type UserDTO } from '@tfg-horarios/shared';
import { UserMapper } from './user.mapper';

export class GetUserByEmailUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(email: string): Promise<UserDTO | null> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      return null;
    }
    return UserMapper.toDTO(user);
  }
}

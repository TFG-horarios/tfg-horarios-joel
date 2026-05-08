import { type IUserRepository } from '../domain/user.repository';
import { NotFoundError } from '@/core/errors/app.error';
import { type UserDTO } from '@tfg-horarios/shared';
import { UserMapper } from './user.mapper';

export class GetUserByIdUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(userId: string): Promise<UserDTO> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }
    return UserMapper.toDTO(user);
  }
}

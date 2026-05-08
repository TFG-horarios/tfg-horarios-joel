import { type IUserRepository } from '../domain/user.repository';
import { NotFoundError } from '@/core/errors/app.error';
import { type UpdateUserDTO, type UserDTO } from '@tfg-horarios/shared';
import { UserMapper } from './user.mapper';

export class UpdateUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(userId: string, dto: UpdateUserDTO): Promise<UserDTO> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }
    user.updateName(dto.name);
    await this.userRepository.update(user);
    return UserMapper.toDTO(user);
  }
}

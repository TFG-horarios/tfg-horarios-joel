import { type IUserRepository } from '../domain/user.repository';
import { type IPasswordHasherService } from '../../auth/domain/password-hasher.service';
import { NotFoundError, UnauthorizedError } from '@/core/errors/app.error';
import { type UpdatePasswordDTO } from '@tfg-horarios/shared';

export class UpdateUserPasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasherService: IPasswordHasherService
  ) {}

  async execute(userId: string, dto: UpdatePasswordDTO): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }

    const isCurrentPasswordValid = await this.passwordHasherService.verify(
      dto.currentPassword,
      user.passwordHash
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedError('Invalid current password');
    }

    const newPasswordHash = await this.passwordHasherService.hash(
      dto.newPassword
    );

    user.updatePassword(newPasswordHash);
    await this.userRepository.update(user);
  }
}

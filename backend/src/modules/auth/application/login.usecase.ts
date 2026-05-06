import type { AuthRepository } from '../domain/auth.repository';
import type { ITokenService } from '../domain/token.service';
import type { IPasswordHasherService } from '../domain/password-hasher.service';
import { UnauthorizedError } from 'src/core/errors/app.error';
import type { LoginDTO, AuthResponseDTO } from '@tfg-horarios/shared';
import { AuthMapper } from './auth.mapper';

export class LoginUseCase {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly tokenService: ITokenService,
    private readonly passwordHasherService: IPasswordHasherService
  ) {}

  async execute(dto: LoginDTO): Promise<AuthResponseDTO> {
    const user = await this.authRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email');
    }

    const isPasswordValid = await this.passwordHasherService.verify(
      dto.password,
      user.passwordHash
    );
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid password');
    }

    const token = await this.tokenService.generate({
      id: user.id,
      name: user.name,
      email: user.email,
    });

    return AuthMapper.toDTO(user, token);
  }
}

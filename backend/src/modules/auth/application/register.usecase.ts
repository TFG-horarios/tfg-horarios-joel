import type { AuthRepository } from '../domain/auth.repository';
import type { ITokenService } from '../domain/token.service';
import type { IPasswordHasherService } from '../domain/password-hasher.service';
import { ConflictError } from 'src/core/errors/app.error';
import { AuthUser } from '../domain/auth.entity';
import type { RegisterDTO, AuthResponseDTO } from '@tfg-horarios/shared';
import { AuthMapper } from './auth.mapper';

export class RegisterUseCase {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly tokenService: ITokenService,
    private readonly passwordHasherService: IPasswordHasherService
  ) {}

  async execute(dto: RegisterDTO): Promise<AuthResponseDTO> {
    const user = await this.authRepository.findByEmail(dto.email);
    if (user) {
      throw new ConflictError('This email is already taken');
    }

    const passwordHash = await this.passwordHasherService.hash(dto.password);

    const newUser = AuthUser.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
    });
    await this.authRepository.create(newUser);

    const token = await this.tokenService.generate({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
    });

    return AuthMapper.toDTO(newUser, token);
  }
}

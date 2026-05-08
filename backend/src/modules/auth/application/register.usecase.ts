import type { AuthRepository } from '../domain/auth.repository';
import type { ITokenService } from '../domain/token.service';
import type { IPasswordHasherService } from '../domain/password-hasher.service';
import { ConflictError } from '@/core/errors/app.error';
import { AuthUser } from '../domain/auth.entity';
import type { RegisterDTO, AuthResponseDTO } from '@tfg-horarios/shared';
import { AuthMapper } from './auth.mapper';
import { PasswordPolicy } from '../domain/password.vo';

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

    const validPassword = PasswordPolicy.create(dto.password);
    const passwordHash = await this.passwordHasherService.hash(
      validPassword.getValue()
    );

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

import type { IAuthUserRepository } from '../domain/auth-user.provider';
import type { ITokenService } from '../domain/token.service';
import type { IPasswordHasherService } from '../domain/password-hasher.service';
import { ConflictError } from '@/core/errors/app.error';
import type { RegisterDTO, AuthResponseDTO } from '@tfg-horarios/shared';
import { AuthMapper } from './auth.mapper';
import { PasswordPolicy } from '../domain/password.vo';

export class RegisterUseCase {
  constructor(
    private readonly authUserRepository: IAuthUserRepository,
    private readonly tokenService: ITokenService,
    private readonly passwordHasherService: IPasswordHasherService
  ) {}

  async execute(dto: RegisterDTO): Promise<AuthResponseDTO> {
    const userExists = await this.authUserRepository.findByEmail(dto.email);
    if (userExists) {
      throw new ConflictError('This email is already taken');
    }

    const validPassword = PasswordPolicy.create(dto.password);
    const passwordHash = await this.passwordHasherService.hash(
      validPassword.getValue()
    );

    const registeredUser = await this.authUserRepository.create({
      name: dto.name,
      email: dto.email,
      passwordHash: passwordHash,
    });

    const token = await this.tokenService.generate({
      id: registeredUser.id,
      name: registeredUser.name,
      email: registeredUser.email,
    });

    return AuthMapper.toDTO(registeredUser, token);
  }
}

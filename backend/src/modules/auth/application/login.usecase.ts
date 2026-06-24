import type { IUserProvider } from '../domain/user.provider';
import type { ITokenService } from '../domain/token.service';
import type { IPasswordHasherService } from '../domain/password-hasher.service';
import { UnauthorizedError } from '@/core/errors/app.error';
import type { LoginDTO, AuthResponseDTO } from '@tfg-horarios/shared';
import { AuthMapper } from './auth.mapper';

export class LoginUseCase {
  constructor(
    private readonly authUserRepository: IUserProvider,
    private readonly tokenService: ITokenService,
    private readonly passwordHasherService: IPasswordHasherService
  ) {}

  async execute(dto: LoginDTO): Promise<AuthResponseDTO> {
    const user = await this.authUserRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isPasswordValid = await this.passwordHasherService.verify(
      dto.password,
      user.passwordHash
    );
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const token = await this.tokenService.generate({
      id: user.id,
      name: user.name,
      email: user.email,
    });

    return AuthMapper.toDTO(user, token);
  }
}

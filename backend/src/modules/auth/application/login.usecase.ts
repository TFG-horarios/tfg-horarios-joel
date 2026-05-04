import type { AuthRepositoryInterface } from '../domain/auth.repository.interface';
import type { IJwtService } from '../domain/jwt.service.interface';
import type { IPasswordHasherService } from '../domain/password-hasher.service.interface';
import { InvalidCredentialsError } from '../domain/auth.errors';
import type { LoginDTO, AuthResponseDTO } from '@tfg-horarios/shared';

export class LoginUseCase {
  constructor(
    private readonly authRepository: AuthRepositoryInterface,
    private readonly jwtService: IJwtService,
    private readonly passwordHasherService: IPasswordHasherService
  ) {}

  async execute(dto: LoginDTO): Promise<AuthResponseDTO> {
    const user = await this.authRepository.findByEmail(dto.email);

    if (!user) {
      throw new InvalidCredentialsError();
    }

    const isPasswordValid = await this.passwordHasherService.verify(
      dto.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    const token = await this.jwtService.sign({
      sub: user.id,
      name: user.name,
      email: user.email,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
    };
  }
}

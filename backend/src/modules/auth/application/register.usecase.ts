import type { AuthRepositoryInterface } from '../domain/auth.repository.interface';
import type { IJwtService } from '../domain/jwt.service.interface';
import type { IPasswordHasherService } from '../domain/password-hasher.service.interface';
import { UserAlreadyExistsError } from '../domain/auth.errors';
import { AuthUser } from '../domain/auth.entity';
import type { RegisterDTO, AuthResponseDTO } from '@tfg-horarios/shared';

export class RegisterUseCase {
  constructor(
    private readonly authRepository: AuthRepositoryInterface,
    private readonly jwtService: IJwtService,
    private readonly passwordHasherService: IPasswordHasherService
  ) {}

  async execute(dto: RegisterDTO): Promise<AuthResponseDTO> {
    const existingUser = await this.authRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new UserAlreadyExistsError();
    }

    const passwordHash = await this.passwordHasherService.hash(dto.password);

    const newUser = AuthUser.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
    });

    await this.authRepository.create(newUser);

    const token = await this.jwtService.sign({
      sub: newUser.id,
      name: newUser.name,
      email: newUser.email,
    });

    return {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
      token,
    };
  }
}

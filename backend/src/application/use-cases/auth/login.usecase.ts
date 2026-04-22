import { IUserRepository } from '../../../domain/repositories/user.repository';
import { IJwtService } from '../../services/jwt.service.interface';
import { IPasswordHasherService } from '../../services/password-hasher.service.interface';
import { LoginDTO, AuthResponseDTO } from '@tfg-horarios/shared';
import { DomainException } from '../../../domain/exceptions/domain.exception';

export class LoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly jwtService: IJwtService,
    private readonly passwordHasherService: IPasswordHasherService
  ) {}

  async execute(dto: LoginDTO): Promise<AuthResponseDTO> {
    const user = await this.userRepository.findByEmail(dto.email);

    if (!user || !user.password) {
      throw new DomainException('Invalid credentials');
    }

    const isPasswordValid = await this.passwordHasherService.verify(
      dto.password,
      user.password
    );
    if (!isPasswordValid) {
      throw new DomainException('Invalid credentials');
    }

    const token = await this.jwtService.sign({
      sub: user.id,
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

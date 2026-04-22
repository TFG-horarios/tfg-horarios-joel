import { IUserRepository } from '../../../domain/repositories/user.repository';
import { IJwtService } from '../../services/jwt.service.interface';
import { IPasswordHasherService } from '../../services/password-hasher.service.interface';
import { RegisterDTO, AuthResponseDTO } from '@tfg-horarios/shared';
import { DomainException } from '../../../domain/exceptions/domain.exception';
import { User } from '../../../domain/entities/user.entity';

export class RegisterUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly jwtService: IJwtService,
    private readonly passwordHasherService: IPasswordHasherService
  ) {}

  async execute(data: RegisterDTO): Promise<AuthResponseDTO> {
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new DomainException('User already exists');
    }

    const hashedPassword = await this.passwordHasherService.hash(data.password);

    const newUser = User.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
    });

    await this.userRepository.save(newUser);

    const token = await this.jwtService.sign({
      sub: newUser.id,
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

import { type AuthResponseDTO } from '@tfg-horarios/shared';
import { AuthUser } from '../domain/auth.entity';

export class AuthMapper {
  static toDTO(user: AuthUser, token: string): AuthResponseDTO {
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

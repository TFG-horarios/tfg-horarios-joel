import { type AuthResponseDTO } from '@tfg-horarios/shared';

export class AuthMapper {
  static toDTO(
    user: { id: string; name: string; email: string },
    token: string
  ): AuthResponseDTO {
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

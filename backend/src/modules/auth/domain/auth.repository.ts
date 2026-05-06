import { AuthUser } from './auth.entity';

export interface AuthRepository {
  findByEmail(email: string): Promise<AuthUser | null>;
  create(user: AuthUser): Promise<void>;
}

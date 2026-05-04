import { AuthUser } from './auth.entity';

export interface AuthRepositoryInterface {
  findByEmail(email: string): Promise<AuthUser | null>;
  create(user: AuthUser): Promise<void>;
}

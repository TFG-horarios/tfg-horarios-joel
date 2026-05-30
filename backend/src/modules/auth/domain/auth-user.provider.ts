export interface AuthUserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}

export interface CreateAuthUserRecord {
  name: string;
  email: string;
  passwordHash: string;
}

export interface IAuthUserRepository {
  findByEmail(email: string): Promise<AuthUserRecord | null>;
  create(user: CreateAuthUserRecord): Promise<AuthUserRecord>;
}

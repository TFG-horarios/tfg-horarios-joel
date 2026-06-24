export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}

export interface CreateUserRecord {
  name: string;
  email: string;
  passwordHash: string;
}

export interface IUserProvider {
  findByEmail(email: string): Promise<UserRecord | null>;
  create(user: CreateUserRecord): Promise<UserRecord>;
}

export interface UserDTO {
  id: string;
  name: string;
  email: string;
}

export interface IUserProvider {
  getUserByEmail(email: string): Promise<UserDTO | null>;
}

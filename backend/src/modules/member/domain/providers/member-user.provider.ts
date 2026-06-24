export interface MemberUserDTO {
  id: string;
  name: string;
  email: string;
}

export interface IMemberUserProvider {
  getUserByEmail(email: string): Promise<MemberUserDTO | null>;
}

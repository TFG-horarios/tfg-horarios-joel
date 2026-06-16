export interface IUserMemberProvider {
  getOrganizationsWhereUserIsSoleAdmin(userId: string): Promise<string[]>;
}

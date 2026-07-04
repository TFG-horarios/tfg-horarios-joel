export interface IMemberProvider {
  getOrganizationsWhereUserIsSoleAdmin(userId: string): Promise<string[]>;
}

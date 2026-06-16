import { type IUserRepository } from '../domain/user.repository';
import type { IUserMemberProvider } from '../domain/user-member.provider';
import { ValidationError } from '@/core/errors/app.error';

export class DeleteUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly memberProvider: IUserMemberProvider
  ) {}

  async execute(userId: string): Promise<void> {
    const soleAdminOrgNames =
      await this.memberProvider.getOrganizationsWhereUserIsSoleAdmin(userId);

    if (soleAdminOrgNames.length > 0) {
      const orgNamesStr = soleAdminOrgNames.join(', ');
      throw new ValidationError(
        `You cannot delete your account because you are the only administrator of the following organizations: ${orgNamesStr}. Please delete these organizations or assign a new administrator before deleting your account.`
      );
    }

    await this.userRepository.delete(userId);
  }
}

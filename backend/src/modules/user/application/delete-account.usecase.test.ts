import { describe, expect, test, mock } from 'bun:test';
import { DeleteUserUseCase } from './delete-account.usecase';
import { ValidationError } from '@/core/errors/app.error';

describe('DeleteUserUseCase', () => {
  const userRepositoryMock = {
    findById: mock(),
    findByEmail: mock(),
    create: mock(),
    update: mock(),
    delete: mock(),
  };

  const memberProviderMock = {
    getOrganizationsWhereUserIsSoleAdmin: mock(),
  };

  const useCase = new DeleteUserUseCase(userRepositoryMock, memberProviderMock);

  test('should successfully delete the user when they are not the sole admin', async () => {
    memberProviderMock.getOrganizationsWhereUserIsSoleAdmin.mockResolvedValueOnce(
      []
    );
    await useCase.execute('user-123');
    expect(
      memberProviderMock.getOrganizationsWhereUserIsSoleAdmin
    ).toHaveBeenCalledWith('user-123');
    expect(userRepositoryMock.delete).toHaveBeenCalledWith('user-123');
  });

  test('should throw ValidationError if the user is the sole admin of an organization', async () => {
    memberProviderMock.getOrganizationsWhereUserIsSoleAdmin.mockResolvedValueOnce(
      ['TFG Org']
    );
    await expect(useCase.execute('user-123')).rejects.toThrow(ValidationError);
    expect(
      memberProviderMock.getOrganizationsWhereUserIsSoleAdmin
    ).toHaveBeenCalledWith('user-123');
  });
});

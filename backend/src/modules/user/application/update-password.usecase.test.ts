import { describe, expect, test, mock } from 'bun:test';
import { UpdateUserPasswordUseCase } from './update-password.usecase';
import { NotFoundError, UnauthorizedError } from '@/core/errors/app.error';
import { User } from '../domain/user.entity';

describe('UpdatePasswordUseCase', () => {
  const repositoryMock = {
    findById: mock(),
    findByEmail: mock(),
    create: mock(),
    update: mock(),
    delete: mock(),
  };

  const passwordHasherMock = { verify: mock(), hash: mock() };

  const useCase = new UpdateUserPasswordUseCase(
    repositoryMock,
    passwordHasherMock
  );

  test('should update password successfully', async () => {
    const user = User.reconstitute({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: 'hash-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    repositoryMock.findById.mockResolvedValue(user);
    passwordHasherMock.verify.mockResolvedValue(true);
    passwordHasherMock.hash.mockResolvedValue('hash-2');

    await useCase.execute('user-1', {
      currentPassword: 'oldPass',
      newPassword: 'newPass',
    });

    expect(passwordHasherMock.verify).toHaveBeenCalledWith('oldPass', 'hash-1');
    expect(passwordHasherMock.hash).toHaveBeenCalledWith('newPass');
    expect(repositoryMock.update).toHaveBeenCalledWith(user);
    expect(user.passwordHash).toBe('hash-2');
  });

  test('should throw NotFoundError if user not found', async () => {
    repositoryMock.findById.mockResolvedValue(null);
    expect(
      useCase.execute('user-1', {
        currentPassword: 'oldPass',
        newPassword: 'newPass',
      })
    ).rejects.toThrow(NotFoundError);
  });

  test('should throw UnauthorizedError if old password is wrong', async () => {
    const user = User.reconstitute({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: 'hash-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    repositoryMock.findById.mockResolvedValue(user);
    passwordHasherMock.verify.mockResolvedValue(false);

    expect(
      useCase.execute('user-1', {
        currentPassword: 'oldPass',
        newPassword: 'newPass',
      })
    ).rejects.toThrow(UnauthorizedError);
  });
});

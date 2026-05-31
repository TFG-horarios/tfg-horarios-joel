import { describe, expect, test, mock } from 'bun:test';
import { UpdateUserUseCase } from './update-user.usecase';
import { User } from '../domain/user.entity';
import { NotFoundError } from '@/core/errors/app.error';

describe('UpdateUserUseCase', () => {
  const repositoryMock = {
    findById: mock(),
    findByEmail: mock(),
    create: mock(),
    update: mock(),
    delete: mock(),
  };
  const useCase = new UpdateUserUseCase(repositoryMock);

  test('should update user successfully', async () => {
    const user = User.create({
      name: 'John',
      email: 'j@e.com',
      passwordHash: 'h',
    });
    repositoryMock.findById.mockResolvedValueOnce(user);
    const result = await useCase.execute('u-1', { name: 'Jane' });
    expect(result.name).toBe('Jane');
    expect(repositoryMock.update).toHaveBeenCalled();
  });

  test('should throw NotFoundError if not found', async () => {
    repositoryMock.findById.mockResolvedValueOnce(null);
    expect(useCase.execute('u-1', { name: 'Jane' })).rejects.toThrow(
      NotFoundError
    );
  });
});

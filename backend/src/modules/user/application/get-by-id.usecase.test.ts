import { describe, expect, test, mock } from 'bun:test';
import { GetUserByIdUseCase } from './get-by-id.usecase';
import { User } from '../domain/user.entity';
import { NotFoundError } from '@/core/errors/app.error';

describe('GetUserByIdUseCase', () => {
  const repositoryMock = {
    findById: mock(),
    findByEmail: mock(),
    create: mock(),
    update: mock(),
    delete: mock(),
  };
  const useCase = new GetUserByIdUseCase(repositoryMock);

  test('should return user if found', async () => {
    const user = User.create({
      name: 'John',
      email: 'j@e.com',
      passwordHash: 'h',
    });
    repositoryMock.findById.mockResolvedValueOnce(user);
    const result = await useCase.execute('u-1');
    expect(result.id).toBe(user.id);
  });

  test('should throw NotFoundError if not found', async () => {
    repositoryMock.findById.mockResolvedValueOnce(null);
    expect(useCase.execute('u-1')).rejects.toThrow(NotFoundError);
  });
});

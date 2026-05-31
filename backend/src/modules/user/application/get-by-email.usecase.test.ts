import { describe, expect, test, mock } from 'bun:test';
import { GetUserByEmailUseCase } from './get-by-email.usecase';
import { User } from '../domain/user.entity';

describe('GetUserByEmailUseCase', () => {
  const repositoryMock = {
    findById: mock(),
    findByEmail: mock(),
    create: mock(),
    update: mock(),
    delete: mock(),
  };
  const useCase = new GetUserByEmailUseCase(repositoryMock);

  test('should return user if found', async () => {
    const user = User.create({
      name: 'John',
      email: 'j@e.com',
      passwordHash: 'h',
    });
    repositoryMock.findByEmail.mockResolvedValueOnce(user);
    const result = await useCase.execute('j@e.com');
    expect(result?.id).toBe(user.id);
  });

  test('should return null if not found', async () => {
    repositoryMock.findByEmail.mockResolvedValueOnce(null);
    const result = await useCase.execute('j@e.com');
    expect(result).toBeNull();
  });
});

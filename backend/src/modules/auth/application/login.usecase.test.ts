import { describe, expect, test, mock } from 'bun:test';
import { LoginUseCase } from './login.usecase';
import { UnauthorizedError } from '@/core/errors/app.error';

describe('LoginUseCase', () => {
  const authUserRepositoryMock = {
    findByEmail: mock(),
    create: mock(),
  };

  const tokenServiceMock = {
    generate: mock(),
    validate: mock(),
  };

  const passwordHasherServiceMock = {
    hash: mock(),
    verify: mock(),
  };

  const useCase = new LoginUseCase(
    authUserRepositoryMock,
    tokenServiceMock,
    passwordHasherServiceMock
  );

  test('successfully logs in', async () => {
    const user = {
      id: 'u-1',
      name: 'John',
      email: 'j@e.com',
      passwordHash: 'hash',
    };
    authUserRepositoryMock.findByEmail.mockResolvedValueOnce(user);
    passwordHasherServiceMock.verify.mockResolvedValueOnce(true);
    tokenServiceMock.generate.mockResolvedValueOnce('token');
    const result = await useCase.execute({
      email: 'j@e.com',
      password: 'password123',
    });
    expect(result.token).toBe('token');
  });

  test('throws UnauthorizedError if user not found', async () => {
    authUserRepositoryMock.findByEmail.mockResolvedValueOnce(null);
    expect(
      useCase.execute({ email: 'j@e.com', password: 'password123' })
    ).rejects.toThrow(UnauthorizedError);
  });

  test('throws UnauthorizedError if password invalid', async () => {
    const user = {
      id: 'u-1',
      name: 'John',
      email: 'j@e.com',
      passwordHash: 'hash',
    };
    authUserRepositoryMock.findByEmail.mockResolvedValueOnce(user);
    passwordHasherServiceMock.verify.mockResolvedValueOnce(false);
    expect(
      useCase.execute({ email: 'j@e.com', password: 'password123' })
    ).rejects.toThrow(UnauthorizedError);
  });
});

import { describe, expect, test, mock } from 'bun:test';
import { RegisterUseCase } from './register.usecase';
import { ConflictError, ValidationError } from '@/core/errors/app.error';

describe('RegisterUseCase', () => {
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

  const useCase = new RegisterUseCase(
    authUserRepositoryMock,
    tokenServiceMock,
    passwordHasherServiceMock
  );

  test('successfully registers', async () => {
    authUserRepositoryMock.findByEmail.mockResolvedValueOnce(null);
    passwordHasherServiceMock.hash.mockResolvedValueOnce('hash');
    const user = {
      id: 'u-1',
      name: 'John',
      email: 'j@e.com',
      passwordHash: 'hash',
    };
    authUserRepositoryMock.create.mockResolvedValueOnce(user);
    tokenServiceMock.generate.mockResolvedValueOnce('token');
    const result = await useCase.execute({
      name: 'John',
      email: 'j@e.com',
      password: 'password123',
    });
    expect(result.token).toBe('token');
  });

  test('throws ConflictError if user exists', async () => {
    authUserRepositoryMock.findByEmail.mockResolvedValueOnce({ id: 'u-1' });
    expect(
      useCase.execute({
        name: 'John',
        email: 'j@e.com',
        password: 'password123',
      })
    ).rejects.toThrow(ConflictError);
  });

  test('throws ValidationError if password too short', async () => {
    authUserRepositoryMock.findByEmail.mockResolvedValueOnce(null);
    expect(
      useCase.execute({ name: 'John', email: 'j@e.com', password: 'short' })
    ).rejects.toThrow(ValidationError);
  });
});

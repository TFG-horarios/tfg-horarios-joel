import { describe, expect, test } from 'bun:test';
import {
  AppError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
} from './app.error';

describe('AppErrors', () => {
  test('AppError creates with right status', () => {
    const error = new AppError('test', 500);
    expect(error.message).toBe('test');
    expect(error.statusCode).toBe(500);
    expect(error.name).toBe('AppError');
  });

  test('NotFoundError creates with 404', () => {
    const error = new NotFoundError('User', '1');
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('User with id 1 not found');
  });

  test('ConflictError creates with 409', () => {
    const error = new ConflictError('conflict');
    expect(error.statusCode).toBe(409);
  });

  test('UnauthorizedError creates with 401', () => {
    const error = new UnauthorizedError();
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('Unauthorized');
  });

  test('ForbiddenError creates with 403', () => {
    const error = new ForbiddenError();
    expect(error.statusCode).toBe(403);
    expect(error.message).toBe('Forbidden');
  });

  test('ValidationError creates with 400', () => {
    const error = new ValidationError('invalid');
    expect(error.statusCode).toBe(400);
  });
});

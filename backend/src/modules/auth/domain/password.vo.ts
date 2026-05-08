import { ValidationError } from '@/core/errors/app.error';

export class PasswordPolicy {
  private constructor(private readonly value: string) {}

  public static create(rawPassword: string): PasswordPolicy {
    if (rawPassword.length < 10) {
      throw new ValidationError('Password must have at least 10 characters');
    }
    if (rawPassword.length > 128) {
      throw new ValidationError('Password must have at most 128 characters');
    }
    return new PasswordPolicy(rawPassword);
  }

  public getValue(): string {
    return this.value;
  }
}

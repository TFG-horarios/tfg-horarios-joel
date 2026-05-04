import { DomainException } from '../../../core/errors/domain.exception';

export class InvalidCredentialsError extends DomainException {
  constructor() {
    super('Invalid credentials');
    this.name = 'InvalidCredentialsError';
  }
}

export class UserAlreadyExistsError extends DomainException {
  constructor() {
    super('User already exists');
    this.name = 'UserAlreadyExistsError';
  }
}

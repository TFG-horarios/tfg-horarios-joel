import { ValidationError } from '@/core/errors/app.error';

export interface AuthUserProps {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export class AuthUser {
  private constructor(private readonly props: AuthUserProps) {}

  public static create(
    props: Omit<AuthUserProps, 'id' | 'createdAt' | 'updatedAt'>
  ): AuthUser {
    const normalizedEmail = props.email.trim().toLowerCase();
    if (!normalizedEmail.includes('@')) {
      throw new ValidationError('Invalid email format');
    }

    if (props.name.trim().length < 2) {
      throw new ValidationError('Name must have at least 2 characters');
    }

    return new AuthUser({
      ...props,
      email: normalizedEmail,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  public static reconstitute(props: AuthUserProps): AuthUser {
    return new AuthUser(props);
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get email(): string {
    return this.props.email;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}

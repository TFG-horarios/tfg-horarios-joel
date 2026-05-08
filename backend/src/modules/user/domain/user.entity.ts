import { ValidationError } from '@/core/errors/app.error';

export interface UserProps {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  private constructor(private readonly props: UserProps) {}

  public static create(
    props: Omit<UserProps, 'id' | 'createdAt' | 'updatedAt'>
  ): User {
    const normalizedEmail = props.email.trim().toLowerCase();
    if (!normalizedEmail.includes('@')) {
      throw new ValidationError('Invalid email format');
    }

    if (props.name.length < 2) {
      throw new ValidationError('Name must have at least 2 characters');
    }

    return new User({
      ...props,
      email: normalizedEmail,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  public static reconstitute(props: UserProps): User {
    return new User(props);
  }

  public updateName(newName: string): void {
    if (newName.trim().length < 2) {
      throw new ValidationError('Name must have at least 2 characters');
    }
    this.props.name = newName;
    this.props.updatedAt = new Date();
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

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}

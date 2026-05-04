import { DomainException } from '../../../core/errors/domain.exception';

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
    if (props.name.length < 2) {
      throw new DomainException('User name must be at least 2 characters long');
    }

    const now = new Date();

    return new User({
      ...props,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(props: UserProps): User {
    return new User(props);
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

  public updateName(name: string): void {
    if (name.length < 2) {
      throw new DomainException('User name must be at least 2 characters long');
    }

    this.props.name = name;
    this.props.updatedAt = new Date();
  }
}

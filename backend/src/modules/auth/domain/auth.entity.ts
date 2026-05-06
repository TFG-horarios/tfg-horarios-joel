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
    return new AuthUser({
      ...props,
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

export interface AuthUserProps {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}

export class AuthUser {
  private constructor(private readonly props: AuthUserProps) {}

  public static create(props: Omit<AuthUserProps, 'id'>): AuthUser {
    return new AuthUser({
      ...props,
      id: crypto.randomUUID(),
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
}

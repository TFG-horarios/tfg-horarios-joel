export type UserRole = 'admin' | 'editor' | 'viewer';

export interface OrganizationMemberProps {
  id: string;
  organizationId: string;
  userId: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export class OrganizationMember {
  private constructor(private readonly props: OrganizationMemberProps) {}

  public static create(props: Omit<OrganizationMemberProps, 'id' | 'createdAt' | 'updatedAt'>): OrganizationMember {
    return new OrganizationMember({
      ...props,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  public static reconstitute(props: OrganizationMemberProps): OrganizationMember {
    return new OrganizationMember(props);
  }

  get id(): string { return this.props.id; }
  get organizationId(): string { return this.props.organizationId; }
  get userId(): string { return this.props.userId; }
  get role(): UserRole { return this.props.role; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  public updateRole(role: UserRole): void {
    this.props.role = role;
    this.props.updatedAt = new Date();
  }
}

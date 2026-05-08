import { ValidationError } from '@/core/errors/app.error';
import { ROLES, type AppRole } from '@/core/permissions/roles';

export interface MemberProps {
  id: string;
  organizationId: string;
  userId: string;
  role: AppRole;
  createdAt: Date;
  updatedAt: Date;
}

export class Member {
  private constructor(private readonly props: MemberProps) {}

  public static create(
    props: Omit<MemberProps, 'id' | 'createdAt' | 'updatedAt'>
  ): Member {
    return new Member({
      ...props,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  public static reconstitute(props: MemberProps): Member {
    return new Member(props);
  }

  updateRole(newRole: AppRole, requesterUserId: string): void {
    if (this.props.role === newRole) return;

    if (
      this.props.userId === requesterUserId &&
      this.props.role === ROLES.ADMIN
    ) {
      throw new ValidationError('An admin cannot be degraded by himself.');
    }

    this.props.role = newRole;
    this.props.updatedAt = new Date();
  }

  get id(): string {
    return this.props.id;
  }
  get organizationId(): string {
    return this.props.organizationId;
  }
  get userId(): string {
    return this.props.userId;
  }
  get role(): AppRole {
    return this.props.role;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}

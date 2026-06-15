import { ValidationError } from '@/core/errors/app.error';

export interface OrganizationProps {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Organization {
  private constructor(private readonly props: OrganizationProps) {}

  public static create(
    props: Omit<OrganizationProps, 'id' | 'createdAt' | 'updatedAt'>
  ): Organization {
    if (props.name.length < 2) {
      throw new ValidationError(
        'Organization name must be at least 2 characters long'
      );
    }

    return new Organization({
      ...props,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  public static reconstitute(props: OrganizationProps): Organization {
    return new Organization(props);
  }

  public update(
    props: Omit<OrganizationProps, 'id' | 'createdAt' | 'updatedAt'>
  ): void {
    if (props.name.length < 2) {
      throw new ValidationError(
        'Organization name must be at least 2 characters long'
      );
    }

    this.props.name = props.name;
    this.props.updatedAt = new Date();
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}

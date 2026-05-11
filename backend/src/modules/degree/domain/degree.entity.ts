import { ValidationError } from '@/core/errors/app.error';

export interface DegreeProps {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export class Degree {
  private constructor(private readonly props: DegreeProps) {}

  public static create(
    props: Omit<DegreeProps, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>
  ): Degree {
    if (props.name.trim().length < 3) {
      throw new ValidationError(
        'Degree name must be at least 3 characters long'
      );
    }
    if (props.code.trim().length < 2) {
      throw new ValidationError(
        'Degree code must be at least 2 characters long'
      );
    }

    return new Degree({
      ...props,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
  }

  public static reconstitute(props: DegreeProps): Degree {
    return new Degree(props);
  }

  public update(name: string, code: string): void {
    if (name.trim().length < 3) {
      throw new ValidationError(
        'Degree name must be at least 3 characters long'
      );
    }
    if (code.trim().length < 2) {
      throw new ValidationError(
        'Degree code must be at least 2 characters long'
      );
    }
    this.props.name = name;
    this.props.code = code;
    this.props.updatedAt = new Date();
  }

  get id() {
    return this.props.id;
  }
  get organizationId() {
    return this.props.organizationId;
  }
  get name() {
    return this.props.name;
  }
  get code() {
    return this.props.code;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }
  get deletedAt() {
    return this.props.deletedAt;
  }
}

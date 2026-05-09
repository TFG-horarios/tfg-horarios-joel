import { ValidationError } from '@/core/errors/app.error';

export type ClassroomType = 'theory' | 'lab';

export interface ClassroomProps {
  id: string;
  organizationId: string;
  name: string;
  capacity: number;
  type: ClassroomType;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export class Classroom {
  private constructor(private readonly props: ClassroomProps) {}

  public static create(
    props: Omit<ClassroomProps, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>
  ): Classroom {
    if (props.capacity <= 0) {
      throw new ValidationError('Capacity must be a positive integer');
    }

    if (props.name.trim().length === 0) {
      throw new ValidationError('Name cannot be empty');
    }

    return new Classroom({
      ...props,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
  }

  public static reconstitute(props: ClassroomProps): Classroom {
    return new Classroom(props);
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

  get capacity() {
    return this.props.capacity;
  }

  get type() {
    return this.props.type;
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

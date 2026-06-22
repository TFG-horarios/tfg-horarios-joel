import { ValidationError } from '@/core/errors/app.error';
import type { ClassroomType } from '@tfg-horarios/shared';

export interface ClassroomProps {
  id: string;
  organizationId: string;
  name: string;
  capacity: number;
  floor: number;
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

    if (!Number.isInteger(props.floor)) {
      throw new ValidationError('Floor must be an integer');
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

  public update(
    name: string,
    capacity: number,
    floor: number,
    type: ClassroomType
  ): void {
    if (capacity <= 0) {
      throw new ValidationError('Capacity must be a positive integer');
    }
    if (name.trim().length === 0) {
      throw new ValidationError('Name cannot be empty');
    }
    if (!Number.isInteger(floor)) {
      throw new ValidationError('Floor must be an integer');
    }

    this.props.name = name;
    this.props.capacity = capacity;
    this.props.floor = floor;
    this.props.type = type;
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

  get capacity() {
    return this.props.capacity;
  }

  get floor() {
    return this.props.floor;
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

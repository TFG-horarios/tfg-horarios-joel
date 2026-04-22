import { DomainException } from '../exceptions/domain.exception';

export interface ClassroomProps {
  id: string;
  organizationId: string;
  name: string;
  capacity: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Classroom {
  private constructor(private readonly props: ClassroomProps) {}

  public static create(props: Omit<ClassroomProps, 'id' | 'createdAt' | 'updatedAt'>): Classroom {
    if (props.name.trim().length === 0) {
      throw new DomainException('Classroom name cannot be empty');
    }

    if (props.capacity <= 0) {
      throw new DomainException('Classroom capacity must be greater than 0');
    }

    return new Classroom({
      ...props,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  public static reconstitute(props: ClassroomProps): Classroom {
    return new Classroom(props);
  }

  get id(): string { return this.props.id; }
  get organizationId(): string { return this.props.organizationId; }
  get name(): string { return this.props.name; }
  get capacity(): number { return this.props.capacity; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
}

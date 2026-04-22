import { DomainException } from '../exceptions/domain.exception';
import { ShiftType } from './subject.entity';

export type GroupType = 'theory' | 'problems' | 'practices';

export interface SubjectGroupProps {
  id: string;
  subjectId: string;
  name: string;
  groupType: GroupType;
  shift: ShiftType;
  groupNumber: number;
  weeklyHours: number;
  numberOfStudents: number;
  createdAt: Date;
  updatedAt: Date;
}

export class SubjectGroup {
  private constructor(private readonly props: SubjectGroupProps) {}

  public static create(props: Omit<SubjectGroupProps, 'id' | 'createdAt' | 'updatedAt'>): SubjectGroup {
    if (props.name.trim().length === 0) {
      throw new DomainException('Subject group name cannot be empty');
    }

    if (props.groupNumber <= 0) {
      throw new DomainException('Group number must be greater than 0');
    }

    if (props.weeklyHours <= 0) {
      throw new DomainException('Weekly hours must be greater than 0');
    }

    if (props.numberOfStudents < 0) {
      throw new DomainException('Number of students cannot be negative');
    }

    return new SubjectGroup({
      ...props,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  public static reconstitute(props: SubjectGroupProps): SubjectGroup {
    return new SubjectGroup(props);
  }

  get id(): string { return this.props.id; }
  get subjectId(): string { return this.props.subjectId; }
  get name(): string { return this.props.name; }
  get groupType(): GroupType { return this.props.groupType; }
  get shift(): ShiftType { return this.props.shift; }
  get groupNumber(): number { return this.props.groupNumber; }
  get weeklyHours(): number { return this.props.weeklyHours; }
  get numberOfStudents(): number { return this.props.numberOfStudents; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
}

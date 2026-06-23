import { ValidationError } from '@/core/errors/app.error';
import type { GroupType, Shift } from '@tfg-horarios/shared';

export interface SubjectGroupProps {
  id: string;
  organizationId: string;
  subjectId: string;
  name: string;
  groupType: GroupType;
  shift: Shift;
  groupNumber: number;
  weeklyHours: number;
  numberOfStudents: number;
  needsComputerLab: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export class SubjectGroup {
  private constructor(private readonly props: SubjectGroupProps) {}

  public static create(
    props: Omit<
      SubjectGroupProps,
      'id' | 'createdAt' | 'updatedAt' | 'deletedAt'
    >
  ): SubjectGroup {
    SubjectGroup.validateBusinessRules(props);

    return new SubjectGroup({
      ...props,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
  }

  public static reconstitute(props: SubjectGroupProps): SubjectGroup {
    return new SubjectGroup(props);
  }

  public update(
    props: Omit<
      SubjectGroupProps,
      | 'id'
      | 'organizationId'
      | 'subjectId'
      | 'createdAt'
      | 'updatedAt'
      | 'deletedAt'
    >
  ): void {
    SubjectGroup.validateBusinessRules({ ...this.props, ...props });

    this.props.name = props.name;
    this.props.groupType = props.groupType;
    this.props.shift = props.shift;
    this.props.groupNumber = props.groupNumber;
    this.props.weeklyHours = props.weeklyHours;
    this.props.numberOfStudents = props.numberOfStudents;
    this.props.needsComputerLab = props.needsComputerLab;
    this.props.updatedAt = new Date();
  }

  private static validateBusinessRules(props: Partial<SubjectGroupProps>) {
    if (props.groupNumber !== undefined && props.groupNumber <= 0) {
      throw new ValidationError('Group number must be a positive integer');
    }
    if (props.weeklyHours !== undefined && props.weeklyHours <= 0) {
      throw new ValidationError('Weekly hours must be positive');
    }
    if (props.numberOfStudents !== undefined && props.numberOfStudents < 0) {
      throw new ValidationError('Number of students cannot be negative');
    }
  }

  get id() {
    return this.props.id;
  }
  get organizationId() {
    return this.props.organizationId;
  }
  get subjectId() {
    return this.props.subjectId;
  }
  get name() {
    return this.props.name;
  }
  get groupType() {
    return this.props.groupType;
  }
  get shift() {
    return this.props.shift;
  }
  get groupNumber() {
    return this.props.groupNumber;
  }
  get weeklyHours() {
    return this.props.weeklyHours;
  }
  get numberOfStudents() {
    return this.props.numberOfStudents;
  }
  get needsComputerLab() {
    return this.props.needsComputerLab;
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

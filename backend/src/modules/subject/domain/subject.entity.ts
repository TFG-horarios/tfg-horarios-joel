import { ValidationError } from '@/core/errors/app.error';
import type { Shift } from '@tfg-horarios/shared';

export interface SubjectProps {
  id: string;
  organizationId: string;
  degreeId: string;
  itineraryId: string | null;
  name: string;
  code: string;
  availableShifts: Shift[];
  numberOfStudents: number;
  courseYear: number;
  period: number;
  weeklyHours: number;
  isCommon: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export class Subject {
  private constructor(private readonly props: SubjectProps) {}

  public static create(
    props: Omit<SubjectProps, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>
  ): Subject {
    Subject.validateBusinessRules(props);

    return new Subject({
      ...props,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
  }

  public static reconstitute(props: SubjectProps): Subject {
    return new Subject(props);
  }

  public update(
    props: Omit<
      SubjectProps,
      | 'id'
      | 'organizationId'
      | 'degreeId'
      | 'createdAt'
      | 'updatedAt'
      | 'deletedAt'
    >
  ): void {
    const nextProps = { ...this.props, ...props };
    if (nextProps.isCommon) {
      nextProps.itineraryId = null;
    }
    Subject.validateBusinessRules(nextProps);

    this.props.name = props.name;
    this.props.code = props.code;
    this.props.availableShifts = props.availableShifts;
    this.props.numberOfStudents = props.numberOfStudents;
    this.props.courseYear = props.courseYear;
    this.props.period = props.period;
    this.props.weeklyHours = props.weeklyHours;
    this.props.isCommon = nextProps.isCommon;
    this.props.itineraryId = nextProps.itineraryId;
    this.props.updatedAt = new Date();
  }

  private static validateBusinessRules(props: Partial<SubjectProps>) {
    if (!props.availableShifts || props.availableShifts.length === 0) {
      throw new ValidationError(
        'A subject must be available in at least one shift'
      );
    }
    if (props.isCommon && props.itineraryId) {
      throw new ValidationError(
        'A common subject cannot belong to a specific itinerary'
      );
    }
    if (!props.isCommon && !props.itineraryId) {
      throw new ValidationError(
        'A specific subject must belong to an itinerary'
      );
    }
  }

  get id() {
    return this.props.id;
  }
  get organizationId() {
    return this.props.organizationId;
  }
  get degreeId() {
    return this.props.degreeId;
  }
  get itineraryId() {
    return this.props.itineraryId;
  }
  get name() {
    return this.props.name;
  }
  get code() {
    return this.props.code;
  }
  get availableShifts() {
    return this.props.availableShifts;
  }
  get numberOfStudents() {
    return this.props.numberOfStudents;
  }
  get courseYear() {
    return this.props.courseYear;
  }
  get period() {
    return this.props.period;
  }
  get weeklyHours() {
    return this.props.weeklyHours;
  }
  get isCommon() {
    return this.props.isCommon;
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

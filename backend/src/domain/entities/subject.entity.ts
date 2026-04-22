import { DomainException } from '../exceptions/domain.exception';
import { SubjectGroup } from './subject-group.entity';

export type ShiftType = 'morning' | 'afternoon';

export interface SubjectProps {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  availableShifts: ShiftType[];
  numberOfStudents: number;
  courseYear: number;
  degree: string;
  period: number;
  weeklyHours: number;
  isCommon: boolean;
  itineraryName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Subject {
  private constructor(private readonly props: SubjectProps) {}

  public static create(props: Omit<SubjectProps, 'id' | 'createdAt' | 'updatedAt'>): Subject {
    if (props.name.trim().length === 0) {
      throw new DomainException('Subject name cannot be empty');
    }

    if (props.code.trim().length === 0) {
      throw new DomainException('Subject code cannot be empty');
    }

    if (props.numberOfStudents < 0) {
      throw new DomainException('Number of students cannot be negative');
    }

    if (props.courseYear <= 0) {
      throw new DomainException('Course year must be greater than 0');
    }

    if (props.availableShifts.length === 0) {
      throw new DomainException('Subject must have at least one available shift');
    }

    if (!props.isCommon && (!props.itineraryName || props.itineraryName.trim().length === 0)) {
      throw new DomainException('Subjects specific to an itinerary must have an itinerary name');
    }

    if (props.isCommon && props.itineraryName) {
      throw new DomainException('Common subjects cannot belong to a specific itinerary');
    }

    return new Subject({
      ...props,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  public static reconstitute(props: SubjectProps): Subject {
    return new Subject(props);
  }

  get id(): string { return this.props.id; }
  get organizationId(): string { return this.props.organizationId; }
  get name(): string { return this.props.name; }
  get code(): string { return this.props.code; }
  get availableShifts(): ShiftType[] { return [...this.props.availableShifts]; }
  get numberOfStudents(): number { return this.props.numberOfStudents; }
  get courseYear(): number { return this.props.courseYear; }
  get degree(): string { return this.props.degree; }
  get period(): number { return this.props.period; }
  get weeklyHours(): number { return this.props.weeklyHours; }
  get isCommon(): boolean { return this.props.isCommon; }
  get itineraryName(): string | undefined { return this.props.itineraryName; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  public validateWeeklyHours(groups: SubjectGroup[]): boolean {
    const shifts = Array.from(new Set(groups.map(g => g.shift)));
    
    for (const shift of shifts) {
      const shiftHours = groups
        .filter(g => g.shift === shift)
        .reduce((sum, g) => sum + g.weeklyHours, 0);
      
      if (shiftHours !== this.props.weeklyHours) {
        return false;
      }
    }
    
    return true;
  }
}

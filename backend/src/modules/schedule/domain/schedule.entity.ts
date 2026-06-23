import type { Shift } from '@tfg-horarios/shared';

export interface ScheduleProps {
  id: string;
  organizationId: string;
  degreeId: string;
  itineraryId?: string | null;
  academicYearId: string;
  shift: Shift;
  courseYear: number;
  period: number;
  isCanonicalCommon?: boolean;
  conflicts: number;
  unassigned?: number;
  status: 'draft' | 'published';
  createdAt: Date;
  updatedAt: Date;
}

export class Schedule {
  private constructor(private readonly props: ScheduleProps) {}

  public static create(
    props: Omit<
      ScheduleProps,
      'id' | 'createdAt' | 'updatedAt' | 'status' | 'conflicts' | 'unassigned'
    > & {
      status?: 'draft' | 'published';
      conflicts?: number;
      unassigned?: number;
    }
  ): Schedule {
    return new Schedule({
      ...props,
      id: crypto.randomUUID(),
      isCanonicalCommon: props.isCanonicalCommon ?? false,
      conflicts: props.conflicts ?? 0,
      unassigned: props.unassigned ?? 0,
      status: props.status ?? 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  public static reconstitute(props: ScheduleProps): Schedule {
    return new Schedule({
      ...props,
      unassigned: props.unassigned ?? 0,
    });
  }

  public publish(): void {
    this.props.status = 'published';
    this.props.updatedAt = new Date();
  }

  public markAsDraft(): void {
    this.props.status = 'draft';
    this.props.updatedAt = new Date();
  }

  public updateConflicts(count: number): void {
    this.props.conflicts = count;
    this.props.updatedAt = new Date();
  }

  public updateConflictsAndUnassigned(conflicts: number, unassigned: number): void {
    this.props.conflicts = conflicts;
    this.props.unassigned = unassigned;
    this.props.updatedAt = new Date();
  }

  public setCanonicalCommon(value: boolean): void {
    this.props.isCanonicalCommon = value;
    this.props.updatedAt = new Date();
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
  get academicYearId() {
    return this.props.academicYearId;
  }
  get shift() {
    return this.props.shift;
  }
  get courseYear() {
    return this.props.courseYear;
  }
  get period() {
    return this.props.period;
  }
  get isCanonicalCommon() {
    return this.props.isCanonicalCommon ?? false;
  }
  get conflicts() {
    return this.props.conflicts;
  }
  get unassigned() {
    return this.props.unassigned ?? 0;
  }
  get status() {
    return this.props.status;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }
}

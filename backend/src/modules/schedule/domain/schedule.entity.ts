export interface ScheduleProps {
  id: string;
  organizationId: string;
  degreeId: string;
  itineraryId?: string | null;
  academicYear: string;
  shift: 'morning' | 'afternoon';
  courseYear: number;
  period: number;
  status: 'draft' | 'published' | 'archived';
  version: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Schedule {
  private constructor(private readonly props: ScheduleProps) {}

  public static create(
    props: Omit<
      ScheduleProps,
      'id' | 'createdAt' | 'updatedAt' | 'version' | 'status'
    > & {
      version?: string;
      status?: 'draft' | 'published' | 'archived';
    }
  ): Schedule {
    return new Schedule({
      ...props,
      id: crypto.randomUUID(),
      status: props.status ?? 'draft',
      version: props.version ?? 'v1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  public static reconstitute(props: ScheduleProps): Schedule {
    return new Schedule(props);
  }

  public publish(): void {
    this.props.status = 'published';
    this.props.updatedAt = new Date();
  }

  public archive(): void {
    this.props.status = 'archived';
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
  get academicYear() {
    return this.props.academicYear;
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
  get status() {
    return this.props.status;
  }
  get version() {
    return this.props.version;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }
}

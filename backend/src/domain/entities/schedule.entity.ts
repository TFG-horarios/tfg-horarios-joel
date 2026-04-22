import { DomainException } from '../exceptions/domain.exception';
import { ShiftType } from './subject.entity';

export type ScheduleStatus = 'draft' | 'published' | 'archived';

export interface ScheduleProps {
  id: string;
  organizationId: string;
  academicYear: string;
  degree: string;
  shift: ShiftType;
  courseYear: number;
  period: number;
  status: ScheduleStatus;
  version: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class Schedule {
  private constructor(private readonly props: ScheduleProps) {}

  public static create(props: Omit<ScheduleProps, 'id' | 'status' | 'version' | 'createdAt' | 'updatedAt'>): Schedule {
    return new Schedule({
      ...props,
      id: crypto.randomUUID(),
      status: 'draft',
      version: 'v1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  public static reconstitute(props: ScheduleProps): Schedule {
    return new Schedule(props);
  }

  get id(): string { return this.props.id; }
  get organizationId(): string { return this.props.organizationId; }
  get academicYear(): string { return this.props.academicYear; }
  get degree(): string { return this.props.degree; }
  get shift(): ShiftType { return this.props.shift; }
  get courseYear(): number { return this.props.courseYear; }
  get period(): number { return this.props.period; }
  get status(): ScheduleStatus { return this.props.status; }
  get version(): string { return this.props.version; }
  get publishedAt(): Date | undefined { return this.props.publishedAt; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  public publish(): void {
    if (this.props.status === 'archived') {
      throw new DomainException('Cannot publish an archived schedule');
    }
    this.props.status = 'published';
    this.props.publishedAt = new Date();
    this.props.updatedAt = new Date();
  }

  public archive(): void {
    this.props.status = 'archived';
    this.props.updatedAt = new Date();
  }
}

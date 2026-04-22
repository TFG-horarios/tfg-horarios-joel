import { DomainException } from '../exceptions/domain.exception';

export interface ScheduleEntryProps {
  id: string;
  scheduleId: string;
  subjectGroupId: string;
  classroomId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ScheduleEntry {
  private constructor(private readonly props: ScheduleEntryProps) {}

  public static create(props: Omit<ScheduleEntryProps, 'id' | 'createdAt' | 'updatedAt'>): ScheduleEntry {
    if (props.dayOfWeek < 1 || props.dayOfWeek > 7) {
      throw new DomainException('Invalid day of week');
    }

    if (!props.startTime.match(/^\d{2}:\d{2}$/) || !props.endTime.match(/^\d{2}:\d{2}$/)) {
        throw new DomainException('Invalid time format, expected HH:mm');
    }

    return new ScheduleEntry({
      ...props,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  public static reconstitute(props: ScheduleEntryProps): ScheduleEntry {
    return new ScheduleEntry(props);
  }

  get id(): string { return this.props.id; }
  get scheduleId(): string { return this.props.scheduleId; }
  get subjectGroupId(): string { return this.props.subjectGroupId; }
  get classroomId(): string { return this.props.classroomId; }
  get dayOfWeek(): number { return this.props.dayOfWeek; }
  get startTime(): string { return this.props.startTime; }
  get endTime(): string { return this.props.endTime; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
}

import type { Shift } from '@tfg-horarios/shared';

export interface ScheduleTimeConfigProps {
  id: string;
  organizationId: string;
  academicYearId: string;
  degreeId: string;
  itineraryId: string | null;
  courseYear: number;
  period: number;
  shift: Shift;
  startTime: string;
  endTime: string;
  hasBreak: boolean;
  breakAfterSlot: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export class ScheduleTimeConfig {
  private constructor(private readonly props: ScheduleTimeConfigProps) {
    this.validate();
  }

  static create(
    props: Omit<ScheduleTimeConfigProps, 'id' | 'createdAt' | 'updatedAt'> & {
      id?: string;
      createdAt?: Date;
      updatedAt?: Date;
    }
  ) {
    return new ScheduleTimeConfig({
      ...props,
      id: props.id ?? crypto.randomUUID(),
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    });
  }

  static reconstitute(props: ScheduleTimeConfigProps) {
    return new ScheduleTimeConfig(props);
  }

  updateTiming(
    props: Pick<
      ScheduleTimeConfigProps,
      'startTime' | 'endTime' | 'hasBreak' | 'breakAfterSlot'
    >
  ) {
    this.props.startTime = props.startTime;
    this.props.endTime = props.endTime;
    this.props.hasBreak = props.hasBreak;
    this.props.breakAfterSlot = props.breakAfterSlot;
    this.props.updatedAt = new Date();
    this.validate();
  }

  private validate() {
    if (this.props.endTime <= this.props.startTime) {
      throw new Error('endTime must be later than startTime.');
    }
    if (this.props.hasBreak && this.props.breakAfterSlot === null) {
      throw new Error('breakAfterSlot is required when break is enabled.');
    }
    if (!this.props.hasBreak && this.props.breakAfterSlot !== null) {
      throw new Error('breakAfterSlot must be null when break is disabled.');
    }
    if (
      this.props.breakAfterSlot !== null &&
      (!Number.isInteger(this.props.breakAfterSlot) ||
        this.props.breakAfterSlot <= 0)
    ) {
      throw new Error('breakAfterSlot must be a positive integer.');
    }
  }

  get id() {
    return this.props.id;
  }
  get organizationId() {
    return this.props.organizationId;
  }
  get academicYearId() {
    return this.props.academicYearId;
  }
  get degreeId() {
    return this.props.degreeId;
  }
  get itineraryId() {
    return this.props.itineraryId;
  }
  get courseYear() {
    return this.props.courseYear;
  }
  get period() {
    return this.props.period;
  }
  get shift() {
    return this.props.shift;
  }
  get startTime() {
    return this.props.startTime;
  }
  get endTime() {
    return this.props.endTime;
  }
  get hasBreak() {
    return this.props.hasBreak;
  }
  get breakAfterSlot() {
    return this.props.breakAfterSlot;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }
}

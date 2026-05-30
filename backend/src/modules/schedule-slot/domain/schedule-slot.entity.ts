export interface ScheduleSlotProps {
  id: string;
  scheduleId: string;
  subjectGroupId: string;
  classroomId: string | null;
  dayOfWeek: number | null;
  slotIndex: number | null;
  duration: number;
  createdAt: Date;
  updatedAt: Date;
}

export class ScheduleSlot {
  private constructor(private readonly props: ScheduleSlotProps) {}

  public static create(
    props: Omit<ScheduleSlotProps, 'id' | 'createdAt' | 'updatedAt'> & {
      id?: string;
    }
  ): ScheduleSlot {
    return new ScheduleSlot({
      ...props,
      id: props.id ?? crypto.randomUUID(),
      classroomId: props.classroomId ?? null,
      dayOfWeek: props.dayOfWeek ?? null,
      slotIndex: props.slotIndex ?? null,
      duration: props.duration ?? 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  public static reconstitute(props: ScheduleSlotProps): ScheduleSlot {
    return new ScheduleSlot(props);
  }

  public assignLocationAndTime(
    classroomId: string | null,
    dayOfWeek: number | null,
    slotIndex: number | null
  ): void {
    this.props.classroomId = classroomId;
    this.props.dayOfWeek = dayOfWeek;
    this.props.slotIndex = slotIndex;
    this.props.updatedAt = new Date();
  }

  get id() {
    return this.props.id;
  }
  get scheduleId() {
    return this.props.scheduleId;
  }
  get subjectGroupId() {
    return this.props.subjectGroupId;
  }
  get classroomId() {
    return this.props.classroomId;
  }
  get dayOfWeek() {
    return this.props.dayOfWeek;
  }
  get slotIndex() {
    return this.props.slotIndex;
  }
  get duration() {
    return this.props.duration;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }
}

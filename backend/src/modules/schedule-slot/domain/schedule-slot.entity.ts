import type { ScheduleConflictDetailDTO } from '@tfg-horarios/shared';

export interface ScheduleSlotProps {
  id: string;
  scheduleId: string;
  subjectGroupId: string;
  classroomId: string | null;
  dayOfWeek: number | null;
  slotIndex: number | null;
  duration: number;
  conflicts: ScheduleConflictDetailDTO[];
  isSharedCommon?: boolean;
  ownerScheduleId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ScheduleSlot {
  private constructor(private readonly props: ScheduleSlotProps) {}

  public static create(
    props: Omit<
      ScheduleSlotProps,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'classroomId'
      | 'dayOfWeek'
      | 'slotIndex'
      | 'conflicts'
    > & {
      id?: string;
      classroomId?: string | null;
      dayOfWeek?: number | null;
      slotIndex?: number | null;
      conflicts?: ScheduleConflictDetailDTO[];
    }
  ): ScheduleSlot {
    return new ScheduleSlot({
      ...props,
      id: props.id ?? crypto.randomUUID(),
      classroomId: props.classroomId ?? null,
      dayOfWeek: props.dayOfWeek ?? null,
      slotIndex: props.slotIndex ?? null,
      duration: props.duration ?? 1,
      conflicts: props.conflicts ?? [],
      isSharedCommon: props.isSharedCommon ?? false,
      ownerScheduleId: props.ownerScheduleId,
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
    this.props.conflicts = [];
    this.props.updatedAt = new Date();
  }

  public updateConflicts(conflicts: ScheduleConflictDetailDTO[]): void {
    this.props.conflicts = conflicts;
    this.props.updatedAt = new Date();
  }

  public asScheduleView(
    scheduleId: string,
    ownerScheduleId: string,
    conflicts: ScheduleConflictDetailDTO[] = this.props.conflicts
  ): ScheduleSlot {
    return ScheduleSlot.reconstitute({
      ...this.props,
      scheduleId,
      conflicts,
      isSharedCommon: true,
      ownerScheduleId,
    });
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
  get conflicts() {
    return this.props.conflicts;
  }
  get isSharedCommon() {
    return this.props.isSharedCommon ?? false;
  }
  get ownerScheduleId() {
    return this.props.ownerScheduleId;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }
}

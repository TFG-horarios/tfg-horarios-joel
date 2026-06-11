import type { ClassroomReservationStatusDTO } from '@tfg-horarios/shared';

export interface ClassroomReservationProps {
  id: string;
  organizationId: string;
  requesterUserId: string;
  classroomId: string;
  academicYearId: string;
  date: string;
  slotIndex: number;
  status: ClassroomReservationStatusDTO;
  reason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class ClassroomReservation {
  private constructor(private readonly props: ClassroomReservationProps) {}

  public static create(
    props: Omit<
      ClassroomReservationProps,
      'id' | 'createdAt' | 'updatedAt' | 'status'
    > & {
      id?: string;
      status?: ClassroomReservationStatusDTO;
    }
  ): ClassroomReservation {
    return new ClassroomReservation({
      ...props,
      id: props.id ?? crypto.randomUUID(),
      status: props.status ?? 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
      reason: props.reason ?? null,
    });
  }

  public static reconstitute(
    props: ClassroomReservationProps
  ): ClassroomReservation {
    return new ClassroomReservation(props);
  }

  public accept(): void {
    this.props.status = 'ACCEPTED';
    this.props.updatedAt = new Date();
  }

  public reject(): void {
    this.props.status = 'REJECTED';
    this.props.updatedAt = new Date();
  }

  public isExpired(): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const reservationDate = new Date(this.props.date);
    reservationDate.setHours(0, 0, 0, 0);

    return reservationDate.getTime() < today.getTime();
  }

  get id() {
    return this.props.id;
  }
  get organizationId() {
    return this.props.organizationId;
  }
  get requesterUserId() {
    return this.props.requesterUserId;
  }
  get classroomId() {
    return this.props.classroomId;
  }
  get academicYearId() {
    return this.props.academicYearId;
  }
  get date() {
    return this.props.date;
  }
  get slotIndex() {
    return this.props.slotIndex;
  }
  get status() {
    return this.props.status;
  }
  get reason() {
    return this.props.reason;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }
}

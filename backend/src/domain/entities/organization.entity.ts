import { DomainException } from '../exceptions/domain.exception';

export type OrganizationPeriodType = 'semester' | 'trimestral' | 'annual';

export interface OrganizationProps {
  id: string;
  name: string;
  periodType: OrganizationPeriodType;
  morningStart: string;
  afternoonStart: string;
  morningEnd: string;
  afternoonEnd: string;
  slotDurationMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Organization {
  private constructor(private readonly props: OrganizationProps) {}

  public static create(
    props: Omit<OrganizationProps, 'id' | 'createdAt' | 'updatedAt'>
  ): Organization {
    if (props.name.length < 3) {
      throw new DomainException(
        'Organization name must be at least 3 characters long'
      );
    }

    if (props.slotDurationMinutes <= 0) {
      throw new DomainException('Slot duration must be greater than 0');
    }

    return new Organization({
      ...props,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  public static reconstitute(props: OrganizationProps): Organization {
    return new Organization(props);
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get periodType(): OrganizationPeriodType {
    return this.props.periodType;
  }

  get morningStart(): string {
    return this.props.morningStart;
  }

  get afternoonStart(): string {
    return this.props.afternoonStart;
  }

  get morningEnd(): string {
    return this.props.morningEnd;
  }

  get afternoonEnd(): string {
    return this.props.afternoonEnd;
  }

  get slotDurationMinutes(): number {
    return this.props.slotDurationMinutes;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public updateName(name: string): void {
    if (name.length < 3) {
      throw new DomainException(
        'Organization name must be at least 3 characters long'
      );
    }
    this.props.name = name;
    this.props.updatedAt = new Date();
  }

  public getAvailableSlots(shift: 'morning' | 'afternoon'): number {
    const start = shift === 'morning' ? this.props.morningStart : this.props.afternoonStart;
    const end = shift === 'morning' ? this.props.morningEnd : this.props.afternoonEnd;

    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);

    const startTotalMinutes = startH * 60 + startM;
    const endTotalMinutes = endH * 60 + endM;

    return Math.floor((endTotalMinutes - startTotalMinutes) / this.props.slotDurationMinutes);
  }
}

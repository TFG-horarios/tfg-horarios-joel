import { ValidationError } from '@/core/errors/app.error';

export type OrganizationPeriodType = 'semester' | 'trimester' | 'annual';

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
    if (props.name.length < 2) {
      throw new ValidationError(
        'Organization name must be at least 2 characters long'
      );
    }

    if (props.slotDurationMinutes <= 0) {
      throw new ValidationError('Slot duration must be greater than 0');
    }

    if (props.morningStart >= props.morningEnd) {
      throw new ValidationError('Morning start time must be before end time');
    }
    if (props.afternoonStart >= props.afternoonEnd) {
      throw new ValidationError('Afternoon start time must be before end time');
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
}

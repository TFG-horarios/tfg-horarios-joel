import { ValidationError } from '@/core/errors/app.error';

export interface ItineraryProps {
  id: string;
  organizationId: string;
  degreeId: string;
  name: string;
  code: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export class Itinerary {
  private constructor(private readonly props: ItineraryProps) {}

  public static create(
    props: Omit<ItineraryProps, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>
  ): Itinerary {
    if (props.name.trim().length < 3) {
      throw new ValidationError(
        'Itinerary name must be at least 3 characters long'
      );
    }
    if (props.code.trim().length < 1) {
      throw new ValidationError('Itinerary code is required');
    }
    return new Itinerary({
      ...props,
      code: props.code.toUpperCase(),
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
  }

  public static reconstitute(props: ItineraryProps): Itinerary {
    return new Itinerary(props);
  }

  public update(name: string, code: string): void {
    if (name.trim().length < 3) {
      throw new ValidationError(
        'Itinerary name must be at least 3 characters long'
      );
    }
    if (code.trim().length < 1) {
      throw new ValidationError('Itinerary code is required');
    }
    this.props.name = name;
    this.props.code = code.toUpperCase();
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
  get name() {
    return this.props.name;
  }
  get code() {
    return this.props.code;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }
  get deletedAt() {
    return this.props.deletedAt;
  }
}

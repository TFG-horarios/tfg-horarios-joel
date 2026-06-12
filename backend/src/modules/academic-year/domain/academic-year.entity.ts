export interface AcademicYearProps {
  id: string;
  organizationId: string;
  name: string;
  period0Start: string | null;
  period0End: string | null;
  period1Start: string | null;
  period1End: string | null;
  period2Start: string | null;
  period2End: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class AcademicYear {
  private constructor(private readonly props: AcademicYearProps) {}

  public static create(
    props: Omit<AcademicYearProps, 'id' | 'createdAt' | 'updatedAt'> & {
      id?: string;
      createdAt?: Date;
      updatedAt?: Date;
    }
  ): AcademicYear {
    return new AcademicYear({
      ...props,
      id: props.id ?? crypto.randomUUID(),
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    });
  }

  public static reconstitute(props: AcademicYearProps): AcademicYear {
    return new AcademicYear(props);
  }

  public get id(): string {
    return this.props.id;
  }

  public get organizationId(): string {
    return this.props.organizationId;
  }

  public get name(): string {
    return this.props.name;
  }

  public get isActive(): boolean {
    const now = new Date().toISOString().split('T')[0];
    let earliestStart: string | null = null;
    let latestEnd: string | null = null;

    const periods = [
      { start: this.period0Start, end: this.period0End },
      { start: this.period1Start, end: this.period1End },
      { start: this.period2Start, end: this.period2End },
    ];

    for (const p of periods) {
      if (p.start && (!earliestStart || p.start < earliestStart))
        earliestStart = p.start;
      if (p.end && (!latestEnd || p.end > latestEnd)) latestEnd = p.end;
    }

    if (!earliestStart || !latestEnd) return false;

    return now! >= earliestStart && now! <= latestEnd;
  }

  public get period0Start(): string | null {
    return this.props.period0Start;
  }

  public get period0End(): string | null {
    return this.props.period0End;
  }

  public get period1Start(): string | null {
    return this.props.period1Start;
  }

  public get period1End(): string | null {
    return this.props.period1End;
  }

  public get period2Start(): string | null {
    return this.props.period2Start;
  }

  public get period2End(): string | null {
    return this.props.period2End;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public update(
    props: Partial<
      Omit<
        AcademicYearProps,
        'id' | 'organizationId' | 'createdAt' | 'updatedAt'
      >
    >
  ): void {
    if (props.name !== undefined) this.props.name = props.name;
    if (props.period0Start !== undefined)
      this.props.period0Start = props.period0Start;
    if (props.period0End !== undefined)
      this.props.period0End = props.period0End;
    if (props.period1Start !== undefined)
      this.props.period1Start = props.period1Start;
    if (props.period1End !== undefined)
      this.props.period1End = props.period1End;
    if (props.period2Start !== undefined)
      this.props.period2Start = props.period2Start;
    if (props.period2End !== undefined)
      this.props.period2End = props.period2End;
    this.props.updatedAt = new Date();
  }

  public getMatchingPeriods(date: Date): number[] {
    const matchingPeriods: number[] = [];
    const dateStr = date.toISOString().split('T')[0];

    const checkPeriod = (
      periodNum: number,
      start: string | null,
      end: string | null
    ) => {
      if (start && end && dateStr! >= start && dateStr! <= end) {
        matchingPeriods.push(periodNum);
      }
    };

    checkPeriod(0, this.period0Start, this.period0End);
    checkPeriod(1, this.period1Start, this.period1End);
    checkPeriod(2, this.period2Start, this.period2End);

    return matchingPeriods;
  }
}

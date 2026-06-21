import type { NotificationTypeDTO } from '@tfg-horarios/shared';

export interface NotificationProps {
  id: string;
  userId: string;
  organizationId: string | null;
  title: string;
  message: string;
  type: NotificationTypeDTO;
  isRead: boolean;
  createdAt: Date;
}

export class Notification {
  private constructor(private readonly props: NotificationProps) {}

  public static create(
    props: Omit<
      NotificationProps,
      'id' | 'isRead' | 'createdAt' | 'organizationId'
    > & {
      id?: string;
      organizationId?: string | null;
    }
  ): Notification {
    return new Notification({
      ...props,
      id: props.id ?? crypto.randomUUID(),
      organizationId: props.organizationId ?? null,
      isRead: false,
      createdAt: new Date(),
    });
  }

  public static reconstitute(props: NotificationProps): Notification {
    return new Notification(props);
  }

  public markAsRead(): void {
    this.props.isRead = true;
  }

  get id() {
    return this.props.id;
  }
  get userId() {
    return this.props.userId;
  }
  get organizationId() {
    return this.props.organizationId;
  }
  get title() {
    return this.props.title;
  }
  get message() {
    return this.props.message;
  }
  get type() {
    return this.props.type;
  }
  get isRead() {
    return this.props.isRead;
  }
  get createdAt() {
    return this.props.createdAt;
  }
}

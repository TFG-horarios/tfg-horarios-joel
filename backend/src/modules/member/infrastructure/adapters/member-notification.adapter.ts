import type { IMemberNotificationProvider } from '../../domain/member-notification.provider';
import type { CreateNotificationUseCase } from '@/modules/notification/application/create-notification.usecase';

export class MemberNotificationAdapter implements IMemberNotificationProvider {
  constructor(
    private readonly createNotificationUseCase: CreateNotificationUseCase
  ) {}

  async notifyAddedToOrganization(
    userId: string,
    organizationId: string
  ): Promise<void> {
    await this.createNotificationUseCase.execute({
      userId,
      organizationId,
      title: 'Añadido a organización',
      message: 'Has sido añadido a una nueva organización.',
      type: 'INFO',
    });
  }

  async notifyRoleUpdated(
    userId: string,
    organizationId: string,
    roleName: string
  ): Promise<void> {
    await this.createNotificationUseCase.execute({
      userId,
      organizationId,
      title: 'Rol actualizado',
      message: `Tu rol en la organización ha sido actualizado a ${roleName}.`,
      type: 'INFO',
    });
  }

  async notifyRemovedFromOrganization(
    userId: string,
    organizationId: string
  ): Promise<void> {
    await this.createNotificationUseCase.execute({
      userId,
      organizationId,
      title: 'Eliminado de la organización',
      message: 'Has sido eliminado de la organización.',
      type: 'WARNING',
    });
  }
}

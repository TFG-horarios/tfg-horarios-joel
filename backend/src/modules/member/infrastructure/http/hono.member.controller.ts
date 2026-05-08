import type { RouteHandler } from '@hono/zod-openapi';
import type { AppEnv } from '@/core/types/app-types';
import type { ListMembersUseCase } from '../../application/list-members.usecase';
import type { AddMemberUseCase } from '../../application/add-member.usecase';
import type { EditMemberRoleUseCase } from '../../application/edit-member-role.usecase';
import type { RemoveMemberUseCase } from '../../application/remove-member.usecase';
import {
  listMembersRoute,
  addMemberRoute,
  updateMemberRoleRoute,
  removeMemberRoute,
} from './hono.member.routes';

export class HonoMemberController {
  constructor(
    private readonly listMembersUseCase: ListMembersUseCase,
    private readonly addMemberUseCase: AddMemberUseCase,
    private readonly editMemberRoleUseCase: EditMemberRoleUseCase,
    private readonly removeMemberUseCase: RemoveMemberUseCase
  ) {}

  list: RouteHandler<typeof listMembersRoute, AppEnv> = async (c) => {
    const { organizationId } = c.req.valid('param');
    const requesterUserId = c.get('userId');
    const members = await this.listMembersUseCase.execute(
      organizationId,
      requesterUserId
    );
    return c.json(members, 200);
  };

  add: RouteHandler<typeof addMemberRoute, AppEnv> = async (c) => {
    const { organizationId } = c.req.valid('param');
    const { email, role } = c.req.valid('json');
    const requesterUserId = c.get('userId');
    const newMember = await this.addMemberUseCase.execute(
      organizationId,
      requesterUserId,
      email,
      role
    );
    return c.json(newMember, 201);
  };

  updateRole: RouteHandler<typeof updateMemberRoleRoute, AppEnv> = async (
    c
  ) => {
    const { organizationId, userId } = c.req.valid('param');
    const { role } = c.req.valid('json');
    const requesterUserId = c.get('userId');
    await this.editMemberRoleUseCase.execute(
      organizationId,
      requesterUserId,
      userId,
      role
    );
    return c.json({ message: 'Role updated successfully' }, 200);
  };

  remove: RouteHandler<typeof removeMemberRoute, AppEnv> = async (c) => {
    const { organizationId, userId } = c.req.valid('param');
    const requesterUserId = c.get('userId');
    await this.removeMemberUseCase.execute(
      organizationId,
      requesterUserId,
      userId,
    );
    return c.body(null, 204);
  };
}

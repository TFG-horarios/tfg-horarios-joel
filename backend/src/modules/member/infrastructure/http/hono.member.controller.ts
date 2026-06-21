import type { RouteHandler } from '@hono/zod-openapi';
import type { AppEnv } from '@/core/types/app-types';
import type { ListMembersUseCase } from '../../application/list-members.usecase';
import type { ListAllMembersUseCase } from '../../application/list-all-members.usecase';
import type { AddMemberUseCase } from '../../application/add-member.usecase';
import type { EditMemberRoleUseCase } from '../../application/edit-member-role.usecase';
import type { RemoveMemberUseCase } from '../../application/remove-member.usecase';
import {
  listMembersRoute,
  addMemberRoute,
  updateMemberRoleRoute,
  removeMemberRoute,
  listAllMembersRoute,
  getMeRoute,
} from './hono.member.routes';
import type { GetMeMemberUseCase } from '../../application/get-me-member.usecase';

export class HonoMemberController {
  constructor(
    private readonly listMembersUseCase: ListMembersUseCase,
    private readonly listAllMembersUseCase: ListAllMembersUseCase,
    private readonly addMemberUseCase: AddMemberUseCase,
    private readonly editMemberRoleUseCase: EditMemberRoleUseCase,
    private readonly removeMemberUseCase: RemoveMemberUseCase,
    private readonly getMeMemberUseCase: GetMeMemberUseCase
  ) {}

  list: RouteHandler<typeof listMembersRoute, AppEnv> = async (c) => {
    const { organizationId } = c.req.valid('param');
    const query = c.req.valid('query');
    const requesterUserId = c.get('userId');
    const members = await this.listMembersUseCase.execute(
      organizationId,
      requesterUserId,
      query
    );
    return c.json(members, 200);
  };

  listAll: RouteHandler<typeof listAllMembersRoute, AppEnv> = async (c) => {
    const { organizationId } = c.req.valid('param');
    const members = await this.listAllMembersUseCase.execute(
      organizationId,
      c.get('userId')
    );
    return c.json(members, 200);
  };

  getMe: RouteHandler<typeof getMeRoute, AppEnv> = async (c) => {
    const { organizationId } = c.req.valid('param');
    const member = await this.getMeMemberUseCase.execute(
      organizationId,
      c.get('userId')
    );
    return c.json(member, 200);
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
    const { organizationId, id } = c.req.valid('param');
    const { role } = c.req.valid('json');
    const requesterUserId = c.get('userId');
    await this.editMemberRoleUseCase.execute(
      organizationId,
      requesterUserId,
      id,
      role
    );
    return c.json({ message: 'Role updated successfully' }, 200);
  };

  remove: RouteHandler<typeof removeMemberRoute, AppEnv> = async (c) => {
    const { organizationId, id } = c.req.valid('param');
    const requesterUserId = c.get('userId');
    await this.removeMemberUseCase.execute(organizationId, requesterUserId, id);
    return c.body(null, 204);
  };
}

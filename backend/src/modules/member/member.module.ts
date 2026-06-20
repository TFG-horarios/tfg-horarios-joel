import { OpenAPIHono } from '@hono/zod-openapi';
import { HonoMemberController } from './infrastructure/http/hono.member.controller';
import { DrizzleMemberRepository } from './infrastructure/db/drizzle.member.repository';
import type { DbConnection } from '@/core/db/connection';
import { RemoveMemberUseCase } from './application/remove-member.usecase';
import { AddMemberUseCase } from './application/add-member.usecase';
import { ListMembersUseCase } from './application/list-members.usecase';
import { ListAllMembersUseCase } from './application/list-all-members.usecase';
import { EditMemberRoleUseCase } from './application/edit-member-role.usecase';
import {
  addMemberRoute,
  removeMemberRoute,
  listMembersRoute,
  listAllMembersRoute,
  updateMemberRoleRoute,
} from './infrastructure/http/hono.member.routes';
import type { AppEnv } from '@/core/types/app-types';
import type { IUserRepository } from '@/modules/user/domain/user.repository';
import { MemberUserAdapter } from './infrastructure/adapters/member-user.adapter';
import { MemberNotificationAdapter } from './infrastructure/adapters/member-notification.adapter';
import type { CreateNotificationUseCase } from '@/modules/notification/application/create-notification.usecase';

export const createMemberModule = (
  db: DbConnection,
  userRepository: IUserRepository,
  createNotificationUseCase: CreateNotificationUseCase
) => {
  const memberRepository = new DrizzleMemberRepository(db);
  const userProvider = new MemberUserAdapter(userRepository);
  const notificationProvider = new MemberNotificationAdapter(
    createNotificationUseCase
  );

  const addUseCase = new AddMemberUseCase(
    memberRepository,
    userProvider,
    notificationProvider
  );
  const listUseCase = new ListMembersUseCase(memberRepository);
  const listAllUseCase = new ListAllMembersUseCase(memberRepository);
  const removeUseCase = new RemoveMemberUseCase(
    memberRepository,
    notificationProvider
  );
  const editRoleUseCase = new EditMemberRoleUseCase(
    memberRepository,
    notificationProvider
  );

  const controller = new HonoMemberController(
    listUseCase,
    listAllUseCase,
    addUseCase,
    editRoleUseCase,
    removeUseCase
  );

  const app = new OpenAPIHono<AppEnv>();
  const routes = app
    .openapi(addMemberRoute, controller.add)
    .openapi(listAllMembersRoute, controller.listAll)
    .openapi(listMembersRoute, controller.list)
    .openapi(updateMemberRoleRoute, controller.updateRole)
    .openapi(removeMemberRoute, controller.remove);
  return routes;
};

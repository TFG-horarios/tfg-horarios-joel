import { OpenAPIHono } from '@hono/zod-openapi';
import { HonoMemberController } from './infrastructure/http/hono.member.controller';
import { DrizzleMemberRepository } from './infrastructure/db/drizzle.member.repository';
import { createAuthMiddleware } from '@/core/middlewares/auth.middleware';
import type { DbConnection } from '@/core/db/connection';
import { JwtService } from '@/modules/auth/infrastructure/services/jwt.service';
import { RemoveMemberUseCase } from './application/remove-member.usecase';
import { AddMemberUseCase } from './application/add-member.usecase';
import { ListMembersUseCase } from './application/list-members.usecase';
import { EditMemberRoleUseCase } from './application/edit-member-role.usecase';
import {
  addMemberRoute,
  removeMemberRoute,
  listMembersRoute,
  updateMemberRoleRoute,
} from './infrastructure/http/hono.member.routes';
import type { AppEnv } from '@/core/types/app-types';
import type { GetUserByEmailUseCase } from '@/modules/user/application/get-by-email.usecase';

export const createMemberModule = (
  db: DbConnection,
  getUserByEmailUseCase: GetUserByEmailUseCase
) => {
  const memberRepository = new DrizzleMemberRepository(db);

  const addUseCase = new AddMemberUseCase(
    memberRepository,
    getUserByEmailUseCase
  );
  const listUseCase = new ListMembersUseCase(memberRepository);
  const removeUseCase = new RemoveMemberUseCase(memberRepository);
  const editRoleUseCase = new EditMemberRoleUseCase(memberRepository);

  const controller = new HonoMemberController(
    listUseCase,
    addUseCase,
    editRoleUseCase,
    removeUseCase
  );

  const router = new OpenAPIHono<AppEnv>();
  const jwtSecret = Bun.env.JWT_SECRET || '';
  const jwtExpiresInSeconds = Number(Bun.env.JWT_EXPIRES_IN_SECONDS) || 86400;
  if (!jwtSecret) throw new Error('JWT_SECRET missing');
  const jwtService = new JwtService(jwtSecret, jwtExpiresInSeconds);

  router.use('*', createAuthMiddleware(jwtService));
  router.openapi(addMemberRoute, controller.add);
  router.openapi(listMembersRoute, controller.list);
  router.openapi(updateMemberRoleRoute, controller.updateRole);
  router.openapi(removeMemberRoute, controller.remove);

  return router;
};

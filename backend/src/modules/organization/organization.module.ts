import { OpenAPIHono } from '@hono/zod-openapi';
import { HonoOrganizationController } from './infrastructure/http/hono.organization.controller';
import { CreateOrganizationUseCase } from './application/create-organization.usecase';
import { ListOrganizationsUseCase } from './application/list-organizations.usecase';
import { DrizzleOrganizationRepository } from './infrastructure/db/drizzle.organization.repository';
import { DrizzleMemberRepository } from '@/modules/member/infrastructure/db/drizzle.member.repository';
import { createAuthMiddleware } from '@/core/middlewares/auth.middleware';
import type { DbConnection } from '@/core/db/connection';
import { JwtService } from '@/modules/auth/infrastructure/services/jwt.service';
import { DeleteOrganizationUseCase } from './application/delete-organization.usecase';
import {
  createOrgRoute,
  deleteOrgRoute,
  listOrgRoute,
} from './infrastructure/http/hono.organization.routes';
import type { AppEnv } from '@/core/types/app-types';

export const createOrganizationModule = (db: DbConnection) => {
  const organizationRepository = new DrizzleOrganizationRepository(db);
  const memberRepository = new DrizzleMemberRepository(db);

  const createUseCase = new CreateOrganizationUseCase(organizationRepository);
  const listUseCase = new ListOrganizationsUseCase(organizationRepository);
  const deleteUseCase = new DeleteOrganizationUseCase(
    organizationRepository,
    memberRepository
  );

  const controller = new HonoOrganizationController(
    createUseCase,
    listUseCase,
    deleteUseCase
  );
  const router = new OpenAPIHono<AppEnv>();
  const jwtSecret = Bun.env.JWT_SECRET || '';
  const jwtExpiresInSeconds = Number(Bun.env.JWT_EXPIRES_IN_SECONDS) || 86400;
  if (!jwtSecret) throw new Error('JWT_SECRET missing');
  const jwtService = new JwtService(jwtSecret, jwtExpiresInSeconds);

  router.use('*', createAuthMiddleware(jwtService));
  router.openapi(createOrgRoute, controller.create);
  router.openapi(listOrgRoute, controller.list);
  router.openapi(deleteOrgRoute, controller.delete);

  return router;
};

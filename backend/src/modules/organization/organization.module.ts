import { OpenAPIHono } from '@hono/zod-openapi';
import { HonoOrganizationController } from './infrastructure/http/hono.organization.controller';
import { CreateOrganizationUseCase } from './application/create-organization.usecase';
import { ListOrganizationsUseCase } from './application/list-organizations.usecase';
import { DrizzleOrganizationRepository } from './infrastructure/db/drizzle.organization.repository';
import { DrizzleOrganizationMemberRepository } from '../organization-member/infrastructure/db/drizzle.organization-member.repository';
import { createAuthMiddleware } from 'src/core/middlewares/auth.middleware';
import type { DbConnection } from 'src/core/db/connection';
import { JwtService } from '../auth/infrastructure/services/jwt.service';
import { DeleteOrganizationUseCase } from './application/delete-organization.usecase';
import {
  createOrgRoute,
  deleteOrgRoute,
  listOrgRoute,
} from './infrastructure/http/hono.organization.routes';

export const createOrganizationModule = (db: DbConnection) => {
  const organizationRepository = new DrizzleOrganizationRepository(db);
  const organizationMemberRepository = new DrizzleOrganizationMemberRepository(
    db
  );

  const createUseCase = new CreateOrganizationUseCase(
    organizationRepository,
    organizationMemberRepository
  );
  const listUseCase = new ListOrganizationsUseCase(
    organizationRepository,
    organizationMemberRepository
  );
  const deleteUseCase = new DeleteOrganizationUseCase(organizationRepository);

  const controller = new HonoOrganizationController(
    createUseCase,
    listUseCase,
    deleteUseCase
  );
  const router = new OpenAPIHono();
  const jwtService = new JwtService();

  router.use('*', createAuthMiddleware(jwtService));
  router.openapi(createOrgRoute, async (c) => controller.create(c));
  router.openapi(listOrgRoute, async (c) => controller.list(c));
  router.openapi(deleteOrgRoute, async (c) => controller.delete(c));

  return router;
};

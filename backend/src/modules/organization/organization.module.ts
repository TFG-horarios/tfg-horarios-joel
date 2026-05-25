import { OpenAPIHono } from '@hono/zod-openapi';
import { HonoOrganizationController } from './infrastructure/http/hono.organization.controller';
import { CreateOrganizationUseCase } from './application/create-organization.usecase';
import { ListOrganizationsUseCase } from './application/list-organizations.usecase';
import { DrizzleOrganizationRepository } from './infrastructure/db/drizzle.organization.repository';
import { DrizzleMemberRepository } from '@/modules/member/infrastructure/db/drizzle.member.repository';
import type { DbConnection } from '@/core/db/connection';
import { DeleteOrganizationUseCase } from './application/delete-organization.usecase';
import {
  createOrgRoute,
  deleteOrgRoute,
  updateOrgRoute,
  listOrgRoute,
  getOrgRoute,
} from './infrastructure/http/hono.organization.routes';
import type { AppEnv } from '@/core/types/app-types';
import { UpdateOrganizationUseCase } from './application/update-organization.usecase';
import { GetOrganizationUseCase } from './application/get-organization.usecase';

export const createOrganizationModule = (db: DbConnection) => {
  const organizationRepository = new DrizzleOrganizationRepository(db);
  const memberRepository = new DrizzleMemberRepository(db);

  const createUseCase = new CreateOrganizationUseCase(organizationRepository);
  const getUseCase = new GetOrganizationUseCase(
    organizationRepository,
    memberRepository
  );
  const listUseCase = new ListOrganizationsUseCase(organizationRepository);
  const updateUseCase = new UpdateOrganizationUseCase(
    organizationRepository,
    memberRepository
  );
  const deleteUseCase = new DeleteOrganizationUseCase(
    organizationRepository,
    memberRepository
  );

  const controller = new HonoOrganizationController(
    createUseCase,
    getUseCase,
    listUseCase,
    updateUseCase,
    deleteUseCase
  );

  const app = new OpenAPIHono<AppEnv>();
  const routes = app
    .openapi(createOrgRoute, controller.create)
    .openapi(getOrgRoute, controller.get)
    .openapi(listOrgRoute, controller.list)
    .openapi(updateOrgRoute, controller.update)
    .openapi(deleteOrgRoute, controller.delete);
  return routes;
};

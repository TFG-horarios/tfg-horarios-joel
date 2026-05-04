import { OpenAPIHono } from '@hono/zod-openapi';
import { z } from 'zod';
import {
  CreateOrganizationSchema,
  OrganizationSchema,
} from '@tfg-horarios/shared';
import { HonoOrganizationController } from './infrastructure/http/hono.organization.controller';
import { CreateOrganizationUseCase } from './application/create-organization.usecase';
import { ListOrganizationsUseCase } from './application/list-organizations.usecase';
import { DrizzleOrganizationRepository } from './infrastructure/database/drizzle.organization.repository';
import { DrizzleOrganizationMemberRepository } from './infrastructure/database/drizzle.organization-member.repository';
import { createAuthMiddleware } from 'src/core/middlewares/auth.middleware';
import type { DbConnection } from 'src/core/db/connection';
import { JwtService } from '../auth/infrastructure/services/jwt.service';

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

  const controller = new HonoOrganizationController(createUseCase, listUseCase);
  const router = new OpenAPIHono();
  const jwtService = new JwtService();

  router.use('*', createAuthMiddleware(jwtService));

  router.openapi(
    {
      method: 'post',
      path: '/',
      request: {
        body: {
          content: {
            'application/json': { schema: CreateOrganizationSchema },
          },
        },
      },
      responses: {
        201: {
          description: 'Organización creada exitosamente',
          content: {
            'application/json': { schema: OrganizationSchema },
          },
        },
        400: { description: 'Error de validación o reglas de negocio' },
      },
    },
    async (c) => controller.create(c)
  );

  router.openapi(
    {
      method: 'get',
      path: '/',
      responses: {
        200: {
          description: 'Listado de organizaciones',
          content: {
            'application/json': { schema: z.array(OrganizationSchema) },
          },
        },
        400: { description: 'Error' },
      },
    },
    async (c) => controller.list(c)
  );

  return router;
};

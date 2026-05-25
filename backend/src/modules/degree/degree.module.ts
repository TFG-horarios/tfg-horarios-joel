import { OpenAPIHono } from '@hono/zod-openapi';
import type { DbConnection } from '@/core/db/connection';
import type { AppEnv } from '@/core/types/app-types';
import { DrizzleDegreeRepository } from './infrastructure/db/drizzle.degree.repository';
import { DrizzleMemberRepository } from '@/modules/member/infrastructure/db/drizzle.member.repository';
import { CreateDegreeUseCase } from './application/create-degree.usecase';
import { BulkCreateDegreesUseCase } from './application/bulk-create-degree.usecase';
import { GetDegreeUseCase } from './application/get-degree.usecase';
import { ListDegreesUseCase } from './application/list-degree.usecase';
import { UpdateDegreeUseCase } from './application/update-degree.usecase';
import { DeleteDegreeUseCase } from './application/delete-degree.usecase';
import { HonoDegreeController } from './infrastructure/http/hono.degree.controller';
import {
  createDegreeRoute,
  bulkCreateDegreesRoute,
  getDegreeRoute,
  listDegreesRoute,
  updateDegreeRoute,
  deleteDegreeRoute,
} from './infrastructure/http/hono.degree.routes';

export const createDegreeModule = (db: DbConnection) => {
  const degreeRepository = new DrizzleDegreeRepository(db);
  const memberRepository = new DrizzleMemberRepository(db);

  const controller = new HonoDegreeController(
    new CreateDegreeUseCase(degreeRepository, memberRepository),
    new BulkCreateDegreesUseCase(degreeRepository, memberRepository),
    new GetDegreeUseCase(degreeRepository, memberRepository),
    new ListDegreesUseCase(degreeRepository, memberRepository),
    new UpdateDegreeUseCase(degreeRepository, memberRepository),
    new DeleteDegreeUseCase(degreeRepository, memberRepository)
  );

  const app = new OpenAPIHono<AppEnv>();
  const routes = app
    .openapi(listDegreesRoute, controller.list)
    .openapi(getDegreeRoute, controller.get)
    .openapi(createDegreeRoute, controller.create)
    .openapi(bulkCreateDegreesRoute, controller.bulkCreate)
    .openapi(updateDegreeRoute, controller.update)
    .openapi(deleteDegreeRoute, controller.delete);
  return routes;
};

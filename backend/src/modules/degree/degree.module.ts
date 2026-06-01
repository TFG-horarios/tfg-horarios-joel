import { OpenAPIHono } from '@hono/zod-openapi';
import type { DbConnection } from '@/core/db/connection';
import type { AppEnv } from '@/core/types/app-types';
import { DrizzleDegreeRepository } from './infrastructure/db/drizzle.degree.repository';
import { CreateDegreeUseCase } from './application/create-degree.usecase';
import { BulkCreateDegreesUseCase } from './application/bulk-create-degree.usecase';
import { GetDegreeUseCase } from './application/get-degree.usecase';
import { ListDegreesUseCase } from './application/list-degree.usecase';
import { UpdateDegreeUseCase } from './application/update-degree.usecase';
import { DeleteDegreeUseCase } from './application/delete-degree.usecase';
import { DeleteAllDegreesUseCase } from './application/delete-all-degrees.usecase';
import { ReplaceDegreesUseCase } from './application/replace-degrees.usecase';
import { HonoDegreeController } from './infrastructure/http/hono.degree.controller';
import {
  createDegreeRoute,
  bulkCreateDegreesRoute,
  getDegreeRoute,
  listDegreesRoute,
  updateDegreeRoute,
  deleteDegreeRoute,
  deleteAllDegreesRoute,
  replaceDegreesRoute,
} from './infrastructure/http/hono.degree.routes';
import type { IMemberRepository } from '@/modules/member/domain/member.repository';
import { DegreeMemberAdapter } from './infrastructure/adapters/degree-member.adapter';

export const createDegreeModule = (
  db: DbConnection,
  memberRepository: IMemberRepository
) => {
  const degreeRepository = new DrizzleDegreeRepository(db);
  const memberProvider = new DegreeMemberAdapter(memberRepository);

  const controller = new HonoDegreeController(
    new CreateDegreeUseCase(degreeRepository, memberProvider),
    new BulkCreateDegreesUseCase(degreeRepository, memberProvider),
    new GetDegreeUseCase(degreeRepository, memberProvider),
    new ListDegreesUseCase(degreeRepository, memberProvider),
    new UpdateDegreeUseCase(degreeRepository, memberProvider),
    new DeleteDegreeUseCase(degreeRepository, memberProvider),
    new DeleteAllDegreesUseCase(degreeRepository, memberProvider),
    new ReplaceDegreesUseCase(degreeRepository, memberProvider)
  );

  const app = new OpenAPIHono<AppEnv>();
  const routes = app
    .openapi(listDegreesRoute, controller.list)
    .openapi(getDegreeRoute, controller.get)
    .openapi(createDegreeRoute, controller.create)
    .openapi(bulkCreateDegreesRoute, controller.bulkCreate)
    .openapi(replaceDegreesRoute, controller.replace)
    .openapi(updateDegreeRoute, controller.update)
    .openapi(deleteDegreeRoute, controller.delete)
    .openapi(deleteAllDegreesRoute, controller.deleteAll);

  return routes;
};

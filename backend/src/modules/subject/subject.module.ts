import { OpenAPIHono } from '@hono/zod-openapi';
import type { DbConnection } from '@/core/db/connection';
import type { AppEnv } from '@/core/types/app-types';
import { DrizzleSubjectRepository } from './infrastructure/db/drizzle.subject.repository';
import { CreateSubjectUseCase } from './application/create-subject.usecase';
import { BulkCreateSubjectUseCase } from './application/bulk-create-subject.usecase';
import { GetSubjectUseCase } from './application/get-subject.usecase';
import { ListSubjectUseCase } from './application/list-subject.usecase';
import { UpdateSubjectUseCase } from './application/update-subject.usecase';
import { DeleteSubjectUseCase } from './application/delete-subject.usecase';
import { HonoSubjectController } from './infrastructure/http/hono.subject.controller';
import {
  createSubjectRoute,
  bulkCreateSubjectsRoute,
  getSubjectRoute,
  listSubjectsRoute,
  updateSubjectRoute,
  deleteSubjectRoute,
} from './infrastructure/http/hono.subject.routes';
import type { IMemberRepository } from '@/modules/member/domain/member.repository';
import { SubjectMemberAdapter } from './infrastructure/adapters/subject-member.adapter';

export const createSubjectModule = (
  db: DbConnection,
  memberRepository: IMemberRepository
) => {
  const subjectRepository = new DrizzleSubjectRepository(db);
  const memberProvider = new SubjectMemberAdapter(memberRepository);

  const controller = new HonoSubjectController(
    new CreateSubjectUseCase(subjectRepository, memberProvider),
    new BulkCreateSubjectUseCase(subjectRepository, memberProvider),
    new GetSubjectUseCase(subjectRepository, memberProvider),
    new ListSubjectUseCase(subjectRepository, memberProvider),
    new UpdateSubjectUseCase(subjectRepository, memberProvider),
    new DeleteSubjectUseCase(subjectRepository, memberProvider)
  );

  const app = new OpenAPIHono<AppEnv>();
  const routes = app
    .openapi(listSubjectsRoute, controller.list)
    .openapi(getSubjectRoute, controller.get)
    .openapi(createSubjectRoute, controller.create)
    .openapi(bulkCreateSubjectsRoute, controller.bulkCreate)
    .openapi(updateSubjectRoute, controller.update)
    .openapi(deleteSubjectRoute, controller.delete);
  return routes;
};

import type { RouteHandler } from '@hono/zod-openapi';
import type { AppEnv } from '@/core/types/app-types';
import { CreateAcademicYearUseCase } from '../../application/create-academic-year.usecase';
import { ListAcademicYearsUseCase } from '../../application/list-academic-years.usecase';
import { UpdateAcademicYearUseCase } from '../../application/update-academic-year.usecase';
import { DeleteAcademicYearUseCase } from '../../application/delete-academic-year.usecase';
import {
  createAcademicYearRoute,
  listAcademicYearsRoute,
  updateAcademicYearRoute,
  deleteAcademicYearRoute,
} from './hono.academic-year.routes';

export class HonoAcademicYearController {
  constructor(
    private readonly createAcademicYearUseCase: CreateAcademicYearUseCase,
    private readonly listAcademicYearsUseCase: ListAcademicYearsUseCase,
    private readonly updateAcademicYearUseCase: UpdateAcademicYearUseCase,
    private readonly deleteAcademicYearUseCase: DeleteAcademicYearUseCase
  ) {}

  create: RouteHandler<typeof createAcademicYearRoute, AppEnv> = async (c) => {
    const { organizationId } = c.req.valid('param');
    const data = c.req.valid('json');
    const requesterUserId = c.get('userId');
    const result = await this.createAcademicYearUseCase.execute(
      organizationId,
      requesterUserId,
      data
    );
    return c.json(result, 201);
  };

  list: RouteHandler<typeof listAcademicYearsRoute, AppEnv> = async (c) => {
    const { organizationId } = c.req.valid('param');
    const requesterUserId = c.get('userId');
    const result = await this.listAcademicYearsUseCase.execute(
      organizationId,
      requesterUserId
    );
    return c.json(result, 200);
  };

  update: RouteHandler<typeof updateAcademicYearRoute, AppEnv> = async (c) => {
    const { organizationId, id } = c.req.valid('param');
    const data = c.req.valid('json');
    const requesterUserId = c.get('userId');
    const result = await this.updateAcademicYearUseCase.execute(
      organizationId,
      id,
      requesterUserId,
      data
    );
    return c.json(result, 200);
  };

  delete: RouteHandler<typeof deleteAcademicYearRoute, AppEnv> = async (c) => {
    const { organizationId, id } = c.req.valid('param');
    const requesterUserId = c.get('userId');
    await this.deleteAcademicYearUseCase.execute(
      organizationId,
      id,
      requesterUserId
    );
    return c.body(null, 204);
  };
}

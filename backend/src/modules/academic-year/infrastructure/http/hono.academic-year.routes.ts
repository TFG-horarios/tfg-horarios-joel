import { createRoute } from '@hono/zod-openapi';
import {
  AcademicYearSchema,
  SaveAcademicYearBodySchema,
} from '@tfg-horarios/shared';
import { z } from '@hono/zod-openapi';

export const createAcademicYearRoute = createRoute({
  method: 'post',
  path: '/organizations/{organizationId}/academic-years',
  request: {
    params: z.object({
      organizationId: z.string().uuid(),
    }),
    body: {
      content: {
        'application/json': {
          schema: SaveAcademicYearBodySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Academic Year created',
      content: {
        'application/json': {
          schema: AcademicYearSchema,
        },
      },
    },
  },
});

export const listAcademicYearsRoute = createRoute({
  method: 'get',
  path: '/organizations/{organizationId}/academic-years',
  request: {
    params: z.object({
      organizationId: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: 'List of academic years',
      content: {
        'application/json': {
          schema: z.array(AcademicYearSchema),
        },
      },
    },
  },
});

export const getActiveAcademicYearRoute = createRoute({
  method: 'get',
  path: '/organizations/{organizationId}/academic-years/active',
  request: {
    params: z.object({
      organizationId: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: 'Active academic year',
      content: {
        'application/json': {
          schema: AcademicYearSchema,
        },
      },
    },
  },
});

export const updateAcademicYearRoute = createRoute({
  method: 'put',
  path: '/organizations/{organizationId}/academic-years/{id}',
  request: {
    params: z.object({
      organizationId: z.string().uuid(),
      id: z.string().uuid(),
    }),
    body: {
      content: {
        'application/json': {
          schema: SaveAcademicYearBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Academic Year updated',
      content: {
        'application/json': {
          schema: AcademicYearSchema,
        },
      },
    },
  },
});

export const deleteAcademicYearRoute = createRoute({
  method: 'delete',
  path: '/organizations/{organizationId}/academic-years/{id}',
  request: {
    params: z.object({
      organizationId: z.uuid(),
      id: z.uuid(),
    }),
  },
  responses: {
    204: {
      description: 'Academic Year deleted',
    },
  },
});

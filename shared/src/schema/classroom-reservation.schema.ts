import { z } from '@hono/zod-openapi';
import { PaginationQuerySchema } from './pagination.schema';

export const ClassroomReservationStatusSchema = z.enum([
  'PENDING',
  'ACCEPTED',
  'REJECTED',
  'CANCELLED',
]);

export const ClassroomReservationSchema = z
  .object({
    id: z.uuid().openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
    organizationId: z
      .uuid()
      .openapi({ example: '123e4567-e89b-12d3-a456-426614174001' }),
    requesterUserId: z
      .uuid()
      .openapi({ example: '123e4567-e89b-12d3-a456-426614174002' }),
    classroomId: z
      .uuid()
      .openapi({ example: '123e4567-e89b-12d3-a456-426614174003' }),
    academicYearId: z.uuid(),
    date: z.string().openapi({ example: '2026-11-15', format: 'date' }),
    slotIndex: z.number().int().openapi({ example: 0 }),
    status: ClassroomReservationStatusSchema.openapi({ example: 'PENDING' }),
    reason: z
      .string()
      .nullable()
      .optional()
      .openapi({ example: 'Recuperación de clase' }),
    createdAt: z.iso.datetime().openapi({ example: '2025-01-01T12:00:00Z' }),
    updatedAt: z.iso.datetime().openapi({ example: '2025-01-01T12:00:00Z' }),
  })
  .openapi('ClassroomReservation');

export const SaveClassroomReservationBodySchema = z
  .object({
    classroomId: z
      .uuid()
      .openapi({ example: '123e4567-e89b-12d3-a456-426614174003' }),
    academicYearId: z.string().uuid(),
    date: z.string().openapi({ example: '2026-11-15', format: 'date' }),
    slotIndex: z.number().int().openapi({ example: 0 }),
    reason: z.string().optional().openapi({ example: 'Examen final' }),
  })
  .openapi('SaveClassroomReservation');

export const UpdateClassroomReservationStatusBodySchema = z
  .object({
    status: ClassroomReservationStatusSchema,
  })
  .openapi('UpdateClassroomReservationStatus');

export const ClassroomReservationListQuerySchema = PaginationQuerySchema.extend(
  {
    classroomId: z.uuid().optional(),
    academicYearId: z.uuid().optional(),
    status: ClassroomReservationStatusSchema.optional(),
    date: z.string().optional(),
  }
);

export const ClassroomReservationBaseParamSchema = z.object({
  organizationId: z.uuid(),
});

export const ClassroomReservationIdParamSchema =
  ClassroomReservationBaseParamSchema.extend({
    id: z.uuid(),
  });

export type ClassroomReservationStatusDTO = z.infer<
  typeof ClassroomReservationStatusSchema
>;
export type ClassroomReservationDTO = z.infer<
  typeof ClassroomReservationSchema
>;
export type SaveClassroomReservationDTO = z.infer<
  typeof SaveClassroomReservationBodySchema
>;
export type UpdateClassroomReservationStatusDTO = z.infer<
  typeof UpdateClassroomReservationStatusBodySchema
>;
export type ClassroomReservationListQueryDTO = z.infer<
  typeof ClassroomReservationListQuerySchema
>;
export type ClassroomReservationIdParamDTO = z.infer<
  typeof ClassroomReservationIdParamSchema
>;

export const ClassroomAvailabilityQuerySchema = z.object({
  classroomId: z.uuid(),
  academicYearId: z.uuid(),
  startDate: z.string().openapi({ format: 'date' }),
  endDate: z.string().openapi({ format: 'date' }),
});

export const OccupiedSlotSchema = z.object({
  date: z.string().openapi({ format: 'date' }),
  slotIndex: z.number().int(),
  reason: z.string(),
});

export const ClassroomAvailabilityResponseSchema = z.object({
  occupiedSlots: z.array(OccupiedSlotSchema),
});

export type ClassroomAvailabilityQueryDTO = z.infer<
  typeof ClassroomAvailabilityQuerySchema
>;
export type OccupiedSlotDTO = z.infer<typeof OccupiedSlotSchema>;
export type ClassroomAvailabilityResponseDTO = z.infer<
  typeof ClassroomAvailabilityResponseSchema
>;

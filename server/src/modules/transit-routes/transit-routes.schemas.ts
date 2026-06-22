import { z } from 'zod';

const routeStatusSchema = z.enum(['ACTIVE', 'INACTIVE']);

export const getTransitRoutesSchema = z.object({
  query: z.object({
    search: z.string().trim().optional(),
    q: z.string().trim().optional(),
    status: routeStatusSchema.optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().optional(),
  }),
});

export const transitRouteIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Route id is required.'),
  }),
});

export const createTransitRouteSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Route name is required.'),
    origin: z.string().trim().min(1, 'Origin is required.'),
    destination: z.string().trim().min(1, 'Destination is required.'),
    distanceKm: z.coerce
      .number()
      .positive('Distance must be greater than 0.'),
    estimatedDurationMinutes: z.coerce
      .number()
      .int('Estimated duration must be an integer.')
      .positive('Estimated duration must be greater than 0.'),
    status: routeStatusSchema.default('ACTIVE'),
  }),
});

export const updateTransitRouteSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Route id is required.'),
  }),
  body: z
    .object({
      name: z.string().trim().min(1, 'Route name is required.').optional(),
      origin: z.string().trim().min(1, 'Origin is required.').optional(),
      destination: z.string().trim().min(1, 'Destination is required.').optional(),
      distanceKm: z.coerce
        .number()
        .positive('Distance must be greater than 0.')
        .optional(),
      estimatedDurationMinutes: z.coerce
        .number()
        .int('Estimated duration must be an integer.')
        .positive('Estimated duration must be greater than 0.')
        .optional(),
      status: routeStatusSchema.optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided.',
    }),
});

export const updateTransitRouteStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Route id is required.'),
  }),
  body: z.object({
    status: routeStatusSchema,
  }),
});

export type GetTransitRoutesQuery = z.infer<typeof getTransitRoutesSchema>['query'];
export type TransitRouteIdParams = z.infer<typeof transitRouteIdParamSchema>['params'];
export type CreateTransitRouteBody = z.infer<typeof createTransitRouteSchema>['body'];
export type UpdateTransitRouteBody = z.infer<typeof updateTransitRouteSchema>['body'];
export type UpdateTransitRouteStatusBody = z.infer<typeof updateTransitRouteStatusSchema>['body'];

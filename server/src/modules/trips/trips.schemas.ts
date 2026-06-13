import { z } from 'zod';

const tripStatusSchema = z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']);

export const getTripsSchema = z.object({
  query: z.object({
    search: z.string().trim().optional(),
    q: z.string().trim().optional(),
    status: tripStatusSchema.optional(),
    vehicleId: z.string().trim().optional(),
    driverId: z.string().trim().optional(),
    routeId: z.string().trim().optional(),
  }),
});

export const tripIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Trip id is required.'),
  }),
});

export const createTripSchema = z.object({
  body: z.object({
    vehicleId: z.string().min(1, 'Vehicle id is required.'),
    driverId: z.string().min(1, 'Driver id is required.'),
    routeId: z.string().min(1, 'Route id is required.'),
    scheduledDeparture: z.coerce.date(),
    notes: z.string().trim().optional().nullable(),
  }),
});

export const updateTripStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Trip id is required.'),
  }),
  body: z.object({
    status: tripStatusSchema,
  }),
});

export type GetTripsQuery = z.infer<typeof getTripsSchema>['query'];
export type TripIdParams = z.infer<typeof tripIdParamSchema>['params'];
export type CreateTripBody = z.infer<typeof createTripSchema>['body'];
export type UpdateTripStatusBody = z.infer<typeof updateTripStatusSchema>['body'];

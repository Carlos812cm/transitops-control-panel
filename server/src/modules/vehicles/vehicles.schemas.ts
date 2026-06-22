import { z } from 'zod';

const vehicleStatusSchema = z.enum(['AVAILABLE', 'INACTIVE', 'MAINTENANCE']);

export const getVehiclesSchema = z.object({
  query: z.object({
    search: z.string().trim().optional(),
    q: z.string().trim().optional(),
    status: vehicleStatusSchema.optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().optional(),
  }),
});

export const vehicleIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Vehicle id is required.'),
  }),
});

export const createVehicleSchema = z.object({
  body: z.object({
    unitNumber: z.string().trim().min(1, 'Unit number is required.'),
    brand: z.string().trim().min(1, 'Brand is required.'),
    model: z.string().trim().min(1, 'Model is required.'),
    year: z.coerce
      .number()
      .int('Year must be an integer.')
      .min(1990, 'Year must be greater than or equal to 1990.'),
    capacity: z.coerce
      .number()
      .int('Capacity must be an integer.')
      .positive('Capacity must be greater than 0.'),
    status: vehicleStatusSchema.default('AVAILABLE'),
    lastMaintenanceDate: z.coerce.date().optional().nullable(),
  }),
});

export const updateVehicleSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Vehicle id is required.'),
  }),
  body: z
    .object({
      unitNumber: z.string().trim().min(1, 'Unit number is required.').optional(),
      brand: z.string().trim().min(1, 'Brand is required.').optional(),
      model: z.string().trim().min(1, 'Model is required.').optional(),
      year: z.coerce
        .number()
        .int('Year must be an integer.')
        .min(1990, 'Year must be greater than or equal to 1990.')
        .optional(),
      capacity: z.coerce
        .number()
        .int('Capacity must be an integer.')
        .positive('Capacity must be greater than 0.')
        .optional(),
      status: vehicleStatusSchema.optional(),
      lastMaintenanceDate: z.coerce.date().optional().nullable(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided.',
    }),
});

export const updateVehicleStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Vehicle id is required.'),
  }),
  body: z.object({
    status: vehicleStatusSchema,
  }),
});

export type GetVehiclesQuery = z.infer<typeof getVehiclesSchema>['query'];
export type VehicleIdParams = z.infer<typeof vehicleIdParamSchema>['params'];
export type CreateVehicleBody = z.infer<typeof createVehicleSchema>['body'];
export type UpdateVehicleBody = z.infer<typeof updateVehicleSchema>['body'];
export type UpdateVehicleStatusBody = z.infer<typeof updateVehicleStatusSchema>['body'];

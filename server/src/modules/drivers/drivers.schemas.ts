import { z } from 'zod';

const driverStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']);

export const getDriversSchema = z.object({
  query: z.object({
    search: z.string().trim().optional(),
    q: z.string().trim().optional(),
    status: driverStatusSchema.optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().optional(),
  }),
});

export const driverIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Driver id is required.'),
  }),
});

export const createDriverSchema = z.object({
  body: z.object({
    firstName: z.string().trim().min(1, 'First name is required.'),
    lastName: z.string().trim().min(1, 'Last name is required.'),
    licenseNumber: z.string().trim().min(1, 'License number is required.'),
    phone: z.string().trim().min(1, 'Phone is required.'),
    email: z.string().trim().email('Email must be valid.'),
    status: driverStatusSchema.default('ACTIVE'),
  }),
});

export const updateDriverSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Driver id is required.'),
  }),
  body: z
    .object({
      firstName: z.string().trim().min(1, 'First name is required.').optional(),
      lastName: z.string().trim().min(1, 'Last name is required.').optional(),
      licenseNumber: z.string().trim().min(1, 'License number is required.').optional(),
      phone: z.string().trim().min(1, 'Phone is required.').optional(),
      email: z.string().trim().email('Email must be valid.').optional(),
      status: driverStatusSchema.optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided.',
    }),
});

export const updateDriverStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Driver id is required.'),
  }),
  body: z.object({
    status: driverStatusSchema,
  }),
});

export type GetDriversQuery = z.infer<typeof getDriversSchema>['query'];
export type DriverIdParams = z.infer<typeof driverIdParamSchema>['params'];
export type CreateDriverBody = z.infer<typeof createDriverSchema>['body'];
export type UpdateDriverBody = z.infer<typeof updateDriverSchema>['body'];
export type UpdateDriverStatusBody = z.infer<typeof updateDriverStatusSchema>['body'];

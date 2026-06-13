import { z } from 'zod';

const userStatusSchema = z.enum([
  'ACTIVE',
  'INACTIVE',
  'PENDING_APPROVAL',
  'REJECTED',
  'SUSPENDED',
]);

const userRoleSchema = z.enum([
  'ADMIN',
  'OPERATOR',
  'SUPERVISOR',
  'VIEWER',
]);

export const getUsersSchema = z.object({
  query: z.object({
    q: z.string().trim().optional(),
    status: userStatusSchema.optional(),
    role: userRoleSchema.optional(),
  }),
});

export const userIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'User id is required.'),
  }),
});

export const updateUserStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'User id is required.'),
  }),
  body: z.object({
    status: userStatusSchema,
  }),
});

export type GetUsersQuery = z.infer<typeof getUsersSchema>['query'];
export type UserIdParams = z.infer<typeof userIdParamSchema>['params'];
export type UpdateUserStatusBody = z.infer<typeof updateUserStatusSchema>['body'];

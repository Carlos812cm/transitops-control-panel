import { z } from 'zod';

const personNameSchema = z
  .string()
  .trim()
  .min(2, 'Name must contain at least 2 characters.')
  .max(60, 'Name must contain at most 60 characters.')
  .regex(/^[\p{L}\p{M}]+(?:[ '’-][\p{L}\p{M}]+)*$/u, 'Name contains invalid characters.');

const phoneSchema = z
  .string()
  .trim()
  .min(8, 'Phone number is too short.')
  .max(25, 'Phone number is too long.')
  .refine(
    (value) => /^\+?[1-9]\d{7,19}$/.test(value.replace(/[\s()-]/g, '')),
    'Phone number must contain between 8 and 20 digits.',
  );

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email('Email must be valid.'),
    password: z.string().min(1, 'Password is required.'),
  }),
});

export const updateProfileSchema = z.object({
  body: z
    .object({
      firstName: personNameSchema,
      lastName: personNameSchema,
      email: z
        .string()
        .trim()
        .email('Email must be valid.')
        .max(100, 'Email must contain at most 100 characters.'),
      phone: phoneSchema,
      currentPassword: z
        .string()
        .min(1, 'Current password cannot be empty.')
        .max(72, 'Current password must contain at most 72 characters.')
        .optional(),
    })
    .strict(),
});

export type LoginBody = z.infer<typeof loginSchema>['body'];
export type UpdateProfileBody = z.infer<typeof updateProfileSchema>['body'];

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

const newPasswordSchema = z
  .string()
  .min(8, 'New password must contain at least 8 characters.')
  .max(72, 'New password must contain at most 72 characters.')
  .regex(/\p{L}/u, 'New password must contain at least one letter.')
  .regex(/\d/, 'New password must contain at least one number.');

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

export const changePasswordSchema = z.object({
  body: z
    .object({
      currentPassword: z
        .string()
        .min(1, 'Current password is required.')
        .max(72, 'Current password must contain at most 72 characters.'),
      newPassword: newPasswordSchema,
      confirmPassword: z
        .string()
        .min(1, 'Password confirmation is required.')
        .max(72, 'Password confirmation must contain at most 72 characters.'),
    })
    .strict()
    .superRefine((body, context) => {
      if (body.newPassword !== body.confirmPassword) {
        context.addIssue({
          code: 'custom',
          path: ['confirmPassword'],
          message: 'Password confirmation does not match.',
        });
      }

      if (body.newPassword === body.currentPassword) {
        context.addIssue({
          code: 'custom',
          path: ['newPassword'],
          message: 'New password must be different from current password.',
        });
      }
    }),
});

export type LoginBody = z.infer<typeof loginSchema>['body'];
export type UpdateProfileBody = z.infer<typeof updateProfileSchema>['body'];
export type ChangePasswordBody = z.infer<typeof changePasswordSchema>['body'];

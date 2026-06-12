import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email('Email must be valid.'),
    password: z.string().min(1, 'Password is required.'),
  }),
});

export type LoginBody = z.infer<typeof loginSchema>['body'];

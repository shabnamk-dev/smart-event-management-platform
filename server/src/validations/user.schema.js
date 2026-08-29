import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  bio: z
    .string()
    .trim()
    .max(500, 'Bio cannot exceed 500 characters')
    .optional()
    .default(''),
  skills: z
    .array(z.string().trim().max(50))
    .max(20, 'Maximum 20 skills allowed')
    .optional()
    .default([]),
  preferred_roles: z
    .array(z.string().trim().max(50))
    .max(10, 'Maximum 10 preferred roles allowed')
    .optional()
    .default([]),
  interests: z
    .array(z.string().trim().max(50))
    .max(10, 'Maximum 10 interests allowed')
    .optional()
    .default([]),
});

import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address')
    .max(150, 'Email cannot exceed 150 characters'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password cannot exceed 128 characters'),
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
  bio: z
    .string()
    .trim()
    .max(500, 'Bio cannot exceed 500 characters')
    .optional()
    .default(''),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password cannot be empty'),
});

export const demoLoginSchema = z.object({
  demoRole: z.enum(['participant', 'judge', 'organizer'], {
    errorMap: () => ({ message: 'demoRole must be one of: participant, judge, organizer' }),
  }),
});

import { z } from 'zod';

export const submissionSchema = z.object({
  title: z
    .string({ required_error: 'Project title is required' })
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title cannot exceed 100 characters'),
  tagline: z
    .string({ required_error: 'Project tagline is required' })
    .trim()
    .min(3, 'Tagline must be at least 3 characters')
    .max(150, 'Tagline cannot exceed 150 characters'),
  description: z
    .string({ required_error: 'Project description is required' })
    .trim()
    .min(10, 'Description must be at least 10 characters long')
    .max(3000, 'Description cannot exceed 3000 characters'),
  repo_url: z
    .string()
    .trim()
    .url('Please provide a valid repository URL (e.g. https://github.com/...)')
    .or(z.literal(''))
    .optional()
    .default(''),
  demo_url: z
    .string()
    .trim()
    .url('Please provide a valid demo URL (e.g. https://...)')
    .or(z.literal(''))
    .optional()
    .default(''),
  track: z
    .string()
    .trim()
    .max(50, 'Track name cannot exceed 50 characters')
    .optional()
    .default('General'),
});

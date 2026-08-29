import { z } from 'zod';

export const createTeamSchema = z.object({
  name: z
    .string({ required_error: 'Team name is required' })
    .trim()
    .min(3, 'Team name must be at least 3 characters long')
    .max(50, 'Team name cannot exceed 50 characters'),
  track: z
    .string()
    .trim()
    .max(50, 'Track name cannot exceed 50 characters')
    .optional()
    .default('General'),
});

export const joinTeamSchema = z.object({
  inviteCode: z
    .string({ required_error: 'Invite code is required' })
    .trim()
    .min(4, 'Invite code must be at least 4 characters long')
    .max(30, 'Invite code cannot exceed 30 characters')
    .toUpperCase(),
});

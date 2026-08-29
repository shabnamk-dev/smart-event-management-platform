import { z } from 'zod';

export const checkinSchema = z.object({
  token: z
    .string({ required_error: 'Attendance token is required' })
    .trim()
    .min(16, 'Attendance token must be at least 16 characters')
    .max(128, 'Attendance token cannot exceed 128 characters'),
});

import { z } from 'zod';

export const evaluationSchema = z.object({
  submission_id: z
    .string({ required_error: 'Submission ID is required' })
    .trim()
    .min(1, 'Submission ID cannot be empty'),
  innovation_score: z
    .number({ required_error: 'Innovation score is required' })
    .min(0, 'Innovation score must be at least 0.0')
    .max(10, 'Innovation score cannot exceed 10.0'),
  technical_score: z
    .number({ required_error: 'Technical score is required' })
    .min(0, 'Technical score must be at least 0.0')
    .max(10, 'Technical score cannot exceed 10.0'),
  impact_score: z
    .number({ required_error: 'Impact score is required' })
    .min(0, 'Impact score must be at least 0.0')
    .max(10, 'Impact score cannot exceed 10.0'),
  presentation_score: z
    .number({ required_error: 'Presentation score is required' })
    .min(0, 'Presentation score must be at least 0.0')
    .max(10, 'Presentation score cannot exceed 10.0'),
  feedback: z
    .string()
    .trim()
    .max(2000, 'Feedback cannot exceed 2000 characters')
    .optional()
    .default(''),
});

export const updateEvaluationSchema = z.object({
  innovation_score: z
    .number({ required_error: 'Innovation score is required' })
    .min(0, 'Innovation score must be at least 0.0')
    .max(10, 'Innovation score cannot exceed 10.0'),
  technical_score: z
    .number({ required_error: 'Technical score is required' })
    .min(0, 'Technical score must be at least 0.0')
    .max(10, 'Technical score cannot exceed 10.0'),
  impact_score: z
    .number({ required_error: 'Impact score is required' })
    .min(0, 'Impact score must be at least 0.0')
    .max(10, 'Impact score cannot exceed 10.0'),
  presentation_score: z
    .number({ required_error: 'Presentation score is required' })
    .min(0, 'Presentation score must be at least 0.0')
    .max(10, 'Presentation score cannot exceed 10.0'),
  feedback: z
    .string()
    .trim()
    .max(2000, 'Feedback cannot exceed 2000 characters')
    .optional()
    .default(''),
});

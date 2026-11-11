import { z } from 'zod';

export const submissionIdParams = z.object({ submissionId: z.string().min(1, 'Submission id is required') });

export const evaluateBody = z.object({
  marksAwarded: z.number({ required_error: 'Marks are required', invalid_type_error: 'Marks must be a number' }).min(0, 'Marks cannot be negative'),
  feedback: z.string().trim().max(2000).optional(),
});

export type EvaluateInput = z.infer<typeof evaluateBody>;

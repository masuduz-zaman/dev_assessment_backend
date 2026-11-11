import { z } from 'zod';

export const startAttemptBody = z.object({ assessmentId: z.string({ required_error: 'Assessment is required' }).min(1, 'Assessment is required') });
export const attemptIdParams = z.object({ id: z.string().min(1, 'Attempt id is required') });

export const submitAttemptBody = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        selectedOptionIds: z.array(z.string()).default([]),
        answerText: z.string().max(20000).optional(),
        code: z.string().max(50000).optional(),
        languageId: z.number().int().optional(),
      }),
    )
    .max(100),
});

export type StartAttemptInput = z.infer<typeof startAttemptBody>;
export type SubmitAttemptInput = z.infer<typeof submitAttemptBody>;

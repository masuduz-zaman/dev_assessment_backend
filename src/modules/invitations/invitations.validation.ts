import { z } from 'zod';

export const createInvitationBody = z.object({
  assessmentId: z.string({ required_error: 'Assessment is required' }).min(1, 'Assessment is required'),
  candidateIds: z.array(z.string().min(1)).min(1, 'Select at least one candidate').max(100),
});

export const invitationIdParams = z.object({ id: z.string().min(1, 'Invitation id is required') });
export const assessmentParams = z.object({ assessmentId: z.string().min(1, 'Assessment id is required') });

export type CreateInvitationInput = z.infer<typeof createInvitationBody>;

import { z } from 'zod';

export const createOfferBody = z.object({
  candidateId: z.string({ required_error: 'Candidate is required' }).min(1, 'Candidate is required'),
  jobTitle: z.string({ required_error: 'Job title is required' }).trim().min(2, 'Job title must be at least 2 characters').max(150),
  message: z.string().trim().max(3000).optional(),
});

export const offerIdParams = z.object({ id: z.string().min(1, 'Offer id is required') });

export const respondOfferBody = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED'], { errorMap: () => ({ message: 'Response must be ACCEPTED or REJECTED' }) }),
});

export type CreateOfferInput = z.infer<typeof createOfferBody>;

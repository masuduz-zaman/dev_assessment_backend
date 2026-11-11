import { z } from 'zod';

export const applyBody = z.object({
  jobId: z.string({ required_error: 'Job is required' }).min(1, 'Job is required'),
  cvUrl: z.union([z.literal(''), z.string().trim().url('CV link must be a valid URL')]).optional().transform((v) => v || undefined),
  coverLetter: z.string().trim().max(5000).optional(),
});

export const applicationIdParams = z.object({ id: z.string().min(1, 'Application id is required') });

export const applicationStatusBody = z.object({
  status: z.enum(['REVIEWING', 'SHORTLISTED', 'REJECTED', 'HIRED'], { errorMap: () => ({ message: 'Invalid application status' }) }),
});

export const companyApplicationsQuery = z.object({
  status: z.enum(['APPLIED', 'REVIEWING', 'SHORTLISTED', 'REJECTED', 'HIRED']).optional(),
  jobId: z.string().optional(),
});

export type ApplyInput = z.infer<typeof applyBody>;
export type CompanyApplicationsQuery = z.infer<typeof companyApplicationsQuery>;

import { z } from 'zod';
import { EMPLOYMENT_TYPES } from '../../constants/options';

const fields = {
  title: z.string({ required_error: 'Job title is required' }).trim().min(3, 'Job title must be at least 3 characters').max(150),
  description: z.string({ required_error: 'Job description is required' }).trim().min(10, 'Description must be at least 10 characters').max(10000),
  location: z.string().trim().max(120).optional(),
  employmentType: z.enum(EMPLOYMENT_TYPES, { errorMap: () => ({ message: 'Choose a valid employment type' }) }).optional(),
  status: z.enum(['DRAFT', 'OPEN', 'CLOSED']),
};

export const createJobBody = z.object({ ...fields, status: fields.status.default('OPEN') });
export const updateJobBody = z
  .object({ title: fields.title.optional(), description: fields.description.optional(), location: fields.location, employmentType: fields.employmentType, status: fields.status.optional() })
  .refine((v) => Object.keys(v).length > 0, { message: 'Provide at least one field to update' });
export const jobIdParams = z.object({ id: z.string().min(1, 'Job id is required') });

export type CreateJobInput = z.infer<typeof createJobBody>;
export type UpdateJobInput = z.infer<typeof updateJobBody>;

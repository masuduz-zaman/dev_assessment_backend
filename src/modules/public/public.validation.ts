import { z } from 'zod';
import { EMPLOYMENT_TYPES } from '../../constants/options';

const search = z.string().trim().max(100).optional();

export const publicSearchQuery = z.object({ search });
export const publicJobsQuery = z.object({ search, type: z.enum(EMPLOYMENT_TYPES).optional() });
export const publicIdParams = z.object({ id: z.string().min(1) });

export type PublicSearchQuery = z.infer<typeof publicSearchQuery>;
export type PublicJobsQuery = z.infer<typeof publicJobsQuery>;

import { z } from 'zod';

const clearable = (schema: z.ZodString) =>
  z.union([z.literal(''), schema]).optional().transform((value) => (value === '' ? null : value));

export const updateProfileBody = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80).optional(),
  headline: clearable(z.string().trim().max(120)),
  bio: clearable(z.string().trim().max(3000)),
  location: clearable(z.string().trim().max(120)),
  phone: clearable(z.string().trim().max(40)),
  cvUrl: clearable(z.string().trim().url('CV link must be a valid URL')),
  portfolioUrl: clearable(z.string().trim().url('Portfolio link must be a valid URL')),
  skills: z.array(z.string().trim().min(1).max(40)).max(40).optional(),
  companyName: z.string().trim().min(2, 'Company name must be at least 2 characters').max(120).optional(),
  description: clearable(z.string().trim().max(3000)),
  website: clearable(z.string().trim().url('Website must be a valid URL')),
  logoUrl: clearable(z.string().trim().url('Logo must be a valid URL')),
});

export type UpdateProfileInput = z.infer<typeof updateProfileBody>;

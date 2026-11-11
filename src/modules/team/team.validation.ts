import { z } from 'zod';
import { PERMISSION_KEYS } from '../../constants/permissions';

const permissions = z.array(z.enum(PERMISSION_KEYS, { errorMap: () => ({ message: 'Unknown permission' }) })).max(PERMISSION_KEYS.length);
const memberRole = z.enum(['ADMIN', 'ASSESSMENT_CREATOR', 'EVALUATOR', 'RECRUITER'], {
  errorMap: () => ({ message: 'Invalid employee role' }),
});

export const memberIdParams = z.object({ id: z.string().min(1, 'Member id is required') });

export const addMemberBody = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(8, 'Temporary password must be at least 8 characters').max(72),
  memberRole,
  permissions: permissions.default([]),
});

export const updateMemberBody = z
  .object({ memberRole: memberRole.optional(), permissions: permissions.optional(), active: z.boolean().optional() })
  .refine((value) => Object.keys(value).length > 0, { message: 'Provide at least one field to update' });

export type AddMemberInput = z.infer<typeof addMemberBody>;
export type UpdateMemberInput = z.infer<typeof updateMemberBody>;

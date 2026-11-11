import { z } from 'zod';
import { SELF_REGISTER_ROLES } from '../../constants/roles';

const email = z.string({ required_error: 'Email is required' }).trim().toLowerCase().email('Enter a valid email address');

const newPassword = z
  .string({ required_error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

const selfRegisterRole = z.enum(SELF_REGISTER_ROLES, {
  errorMap: () => ({ message: 'Role must be COMPANY or CANDIDATE' }),
});

export const registerBody = z
  .object({
    name: z.string({ required_error: 'Name is required' }).trim().min(2, 'Name must be at least 2 characters').max(80),
    email,
    password: newPassword,
    role: selfRegisterRole.default('CANDIDATE'),
    companyName: z.string().trim().min(2, 'Company name must be at least 2 characters').max(120).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.role === 'COMPANY' && !value.companyName) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['companyName'], message: 'Company name is required for company accounts' });
    }
  });

export const loginBody = z.object({
  email,
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
});

export const googleLoginBody = z.object({
  idToken: z.string({ required_error: 'Google ID token is required' }).min(20, 'Google ID token is invalid'),
  role: selfRegisterRole.default('CANDIDATE'),
  companyName: z.string().trim().min(2).max(120).optional(),
});

export type RegisterInput = z.infer<typeof registerBody>;
export type LoginInput = z.infer<typeof loginBody>;
export type GoogleLoginInput = z.infer<typeof googleLoginBody>;

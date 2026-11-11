import { z } from 'zod';

const id = z.string().min(1, 'Id is required');
const search = z.string().trim().max(100).optional();

export const idParams = z.object({ id });

export const companyListQuery = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED']).optional(),
  search,
});

export const updateCompanyStatusBody = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'SUSPENDED'], { errorMap: () => ({ message: 'Status must be APPROVED, REJECTED or SUSPENDED' }) }),
  reason: z.string().trim().max(500).optional(),
});

export const userListQuery = z.object({
  role: z.enum(['COMPANY', 'CANDIDATE']).optional(),
  status: z.enum(['ACTIVE', 'PENDING', 'SUSPENDED']).optional(),
  search,
});

export const updateUserStatusBody = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED'], { errorMap: () => ({ message: 'Status must be ACTIVE or SUSPENDED' }) }),
});

export type CompanyListQuery = z.infer<typeof companyListQuery>;
export type UserListQuery = z.infer<typeof userListQuery>;
export type UpdateCompanyStatusInput = z.infer<typeof updateCompanyStatusBody>;

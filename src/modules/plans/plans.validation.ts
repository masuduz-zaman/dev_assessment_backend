import { z } from 'zod';

const fields = {
  code: z.string().trim().toLowerCase().regex(/^[a-z0-9-]{2,40}$/, 'Code may only contain lowercase letters, numbers and dashes'),
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  description: z.string().trim().max(500).optional(),
  amount: z.number({ invalid_type_error: 'Amount must be a number' }).int('Amount must be a whole number of minor units').positive('Amount must be greater than 0'),
  currency: z.string().trim().length(3, 'Currency must be a 3 letter code').transform((v) => v.toUpperCase()),
  features: z.array(z.string().trim().min(1).max(120)).max(12),
  active: z.boolean(),
  sortOrder: z.number().int(),
};

export const createPlanBody = z.object({
  ...fields,
  currency: fields.currency.default('BDT'),
  features: fields.features.default([]),
  active: fields.active.default(true),
  sortOrder: fields.sortOrder.default(0),
});

export const updatePlanBody = z
  .object({
    name: fields.name.optional(),
    description: fields.description,
    amount: fields.amount.optional(),
    currency: fields.currency.optional(),
    features: fields.features.optional(),
    active: fields.active.optional(),
    sortOrder: fields.sortOrder.optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Provide at least one field to update' });

export const planIdParams = z.object({ id: z.string().min(1, 'Plan id is required') });

export type CreatePlanInput = z.infer<typeof createPlanBody>;
export type UpdatePlanInput = z.infer<typeof updatePlanBody>;

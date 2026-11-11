export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  COMPANY: 'COMPANY',
  CANDIDATE: 'CANDIDATE',
} as const;

export type AppRole = (typeof ROLES)[keyof typeof ROLES];

/** Roles a visitor may pick while self-registering. Super admins are only created by the seed script. */
export const SELF_REGISTER_ROLES = [ROLES.COMPANY, ROLES.CANDIDATE] as const;

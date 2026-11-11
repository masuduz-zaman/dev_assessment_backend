import type { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: Role; email: string; name: string };
      /** Set for company owners and active company employees. */
      companyId?: string;
      /** Permission keys of the signed in company user. Owners receive ['*']. */
      permissions?: string[];
    }
  }
}

export {};

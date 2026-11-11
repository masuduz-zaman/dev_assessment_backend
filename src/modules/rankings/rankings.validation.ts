import { z } from 'zod';

export const rankingQuery = z.object({ scope: z.enum(['public', 'company']).default('public') });
export type RankingQuery = z.infer<typeof rankingQuery>;

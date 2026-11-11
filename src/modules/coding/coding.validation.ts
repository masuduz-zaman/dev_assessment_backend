import { z } from 'zod';
import { CODING_LANGUAGES } from '../../constants/options';

const languageIds = CODING_LANGUAGES.map((l) => l.id) as number[];

export const executeCodeBody = z.object({
  source_code: z.string({ required_error: 'Source code is required' }).min(1, 'Source code is required').max(50000),
  language_id: z.number().int().refine((id) => languageIds.includes(id), 'Unsupported programming language'),
  stdin: z.string().max(20000).default(''),
  time_limit: z.number().min(1).max(10).default(5),
  memory_limit: z.number().max(256000).default(128000),
});

export type ExecuteCodeInput = z.infer<typeof executeCodeBody>;

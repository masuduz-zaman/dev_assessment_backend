import { z } from 'zod';
import { CODING_LANGUAGES } from '../../constants/options';

const languageIds = CODING_LANGUAGES.map((l) => l.id) as number[];

const questionSchema = z
  .object({
    type: z.enum(['MCQ', 'CODING', 'WRITTEN'], { errorMap: () => ({ message: 'Question type must be MCQ, CODING or WRITTEN' }) }),
    prompt: z.string({ required_error: 'Question prompt is required' }).trim().min(1, 'Question prompt is required').max(5000),
    marks: z.number({ invalid_type_error: 'Marks must be a number' }).positive('Marks must be greater than 0').max(1000),
    explanation: z.string().trim().max(2000).optional(),
    options: z
      .array(z.object({ text: z.string().trim().min(1, 'Option text is required').max(500), isCorrect: z.boolean() }))
      .max(10)
      .optional(),
    starterCode: z.string().max(20000).optional(),
    languageIds: z.array(z.number().int()).optional(),
    timeLimitSeconds: z.number().int().min(1).max(10).default(5),
    memoryLimitKb: z.number().int().min(16000).max(256000).default(128000),
    testCases: z
      .array(
        z.object({
          input: z.string().max(20000),
          expectedOutput: z.string().max(20000),
          isHidden: z.boolean().default(true),
          weight: z.number().positive().default(1),
        }),
      )
      .max(30)
      .optional(),
  })
  .superRefine((q, ctx) => {
    if (q.type === 'MCQ') {
      if (!q.options || q.options.length < 2) {
        ctx.addIssue({ code: 'custom', path: ['options'], message: 'MCQ questions need at least 2 options' });
      } else if (!q.options.some((o) => o.isCorrect)) {
        ctx.addIssue({ code: 'custom', path: ['options'], message: 'Mark at least one option as correct' });
      }
    }
    if (q.type === 'CODING') {
      if (!q.languageIds || q.languageIds.length === 0) {
        ctx.addIssue({ code: 'custom', path: ['languageIds'], message: 'Select at least one programming language' });
      } else if (q.languageIds.some((id) => !languageIds.includes(id))) {
        ctx.addIssue({ code: 'custom', path: ['languageIds'], message: 'One or more languages are not supported' });
      }
      if (!q.testCases || q.testCases.length === 0) {
        ctx.addIssue({ code: 'custom', path: ['testCases'], message: 'Coding questions need at least one test case' });
      }
    }
  });

const dateField = z.coerce.date({ invalid_type_error: 'Enter a valid date' });

const assessmentFields = {
  title: z.string({ required_error: 'Title is required' }).trim().min(3, 'Title must be at least 3 characters').max(150),
  description: z.string().trim().max(3000).optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE'], { errorMap: () => ({ message: 'Visibility must be PUBLIC or PRIVATE' }) }),
  durationMinutes: z.number({ invalid_type_error: 'Duration must be a number' }).int().min(1, 'Duration must be at least 1 minute').max(600),
  maxAttempts: z.number().int().min(1).max(10),
  passMarks: z.number().min(0),
  startsAt: dateField,
  endsAt: dateField,
};

export const createAssessmentBody = z
  .object({
    ...assessmentFields,
    maxAttempts: assessmentFields.maxAttempts.default(1),
    passMarks: assessmentFields.passMarks.optional(),
    startsAt: assessmentFields.startsAt.optional(),
    endsAt: assessmentFields.endsAt.optional(),
    questions: z.array(questionSchema).min(1, 'Add at least one question').max(100),
  })
  .refine((v) => !v.startsAt || !v.endsAt || v.endsAt > v.startsAt, { path: ['endsAt'], message: 'End date must be after the start date' });

export const updateAssessmentBody = z
  .object({
    title: assessmentFields.title.optional(),
    description: assessmentFields.description,
    visibility: assessmentFields.visibility.optional(),
    durationMinutes: assessmentFields.durationMinutes.optional(),
    maxAttempts: assessmentFields.maxAttempts.optional(),
    passMarks: assessmentFields.passMarks.optional(),
    startsAt: assessmentFields.startsAt.nullable().optional(),
    endsAt: assessmentFields.endsAt.nullable().optional(),
    questions: z.array(questionSchema).min(1, 'Add at least one question').max(100).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Provide at least one field to update' });

export const assessmentIdParams = z.object({ id: z.string().min(1, 'Assessment id is required') });

export const assessmentListQuery = z.object({
  scope: z.enum(['mine', 'public']).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  search: z.string().trim().max(100).optional(),
});

export type QuestionInput = z.infer<typeof questionSchema>;
export type CreateAssessmentInput = z.infer<typeof createAssessmentBody>;
export type UpdateAssessmentInput = z.infer<typeof updateAssessmentBody>;
export type AssessmentListQuery = z.infer<typeof assessmentListQuery>;

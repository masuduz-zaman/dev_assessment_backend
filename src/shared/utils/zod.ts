import type { ZodError } from "zod";
import type { FieldError } from "../errors/apiError";

/** Flatten Zod issues into [{ field: 'questions.0.prompt', message }] */
export function zodToFieldErrors(
  error: ZodError,
  prefix?: string,
): FieldError[] {
  return error.issues.map((issue) => ({
    field:
      [prefix, ...issue.path]
        .filter((part) => part !== undefined && part !== "")
        .join(".") || undefined,
    message: issue.message,
  }));
}

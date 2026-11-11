/** Static option lists exposed through GET /api/public/meta so the frontend never hard-codes them. */
export const CODING_LANGUAGES = [
  { id: 71, name: "Python 3" },
  { id: 63, name: "JavaScript (Node.js)" },
  { id: 74, name: "TypeScript" },
  { id: 62, name: "Java" },
  { id: 54, name: "C++" },
  { id: 50, name: "C" },
  { id: 60, name: "Go" },
  { id: 68, name: "PHP" },
] as const;

export const EMPLOYMENT_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
  "Remote",
] as const;

export const QUESTION_TYPES = [
  { value: "MCQ", label: "Multiple choice" },
  { value: "CODING", label: "Coding" },
  { value: "WRITTEN", label: "Written" },
] as const;

export const ASSESSMENT_VISIBILITY = [
  { value: "PRIVATE", label: "Private (invitation only)" },
  { value: "PUBLIC", label: "Public" },
] as const;

export const DEFAULT_PASS_PERCENTAGE = 40;

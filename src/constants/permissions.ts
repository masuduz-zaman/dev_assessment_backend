export const PERMISSIONS = [
  { key: 'assessment:create', label: 'Create assessments', description: 'Build, edit and delete assessments' },
  { key: 'assessment:publish', label: 'Publish assessments', description: 'Make a draft assessment available to candidates' },
  { key: 'assessment:invite', label: 'Invite candidates', description: 'Send private assessment invitations' },
  { key: 'assessment:evaluate', label: 'Evaluate submissions', description: 'Review written and coding answers and see results' },
  { key: 'recruitment:manage', label: 'Manage recruitment', description: 'Post jobs, review applications and send offers' },
  { key: 'team:manage', label: 'Manage team', description: 'Add employees and change their permissions' },
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number]['key'];

export const PERMISSION_KEYS = PERMISSIONS.map((p) => p.key) as [PermissionKey, ...PermissionKey[]];

export const MEMBER_ROLES = [
  { value: 'ADMIN', label: 'Admin', defaultPermissions: PERMISSION_KEYS.slice() },
  { value: 'ASSESSMENT_CREATOR', label: 'Assessment creator', defaultPermissions: ['assessment:create', 'assessment:publish', 'assessment:invite'] },
  { value: 'EVALUATOR', label: 'Evaluator', defaultPermissions: ['assessment:evaluate'] },
  { value: 'RECRUITER', label: 'Recruiter', defaultPermissions: ['recruitment:manage', 'assessment:invite'] },
] as const;

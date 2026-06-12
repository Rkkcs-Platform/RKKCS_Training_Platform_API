export const ACTIVITY_TARGET = {
  USER: 'user',
  CHALLENGE: 'challenge',
  SUBMISSION: 'submission',
} as const;

export type ActivityTarget =
  (typeof ACTIVITY_TARGET)[keyof typeof ACTIVITY_TARGET];

export const ACTIVITY_TARGET = {
  USER: 'user',
  CHALLENGE: 'challenge',
  SUBMISSION: 'submission',
  SHOP: 'shop',
  ORDER: 'order',
  PROCESSING_JOB: 'processing_job',
} as const;

export type ActivityTarget =
  (typeof ACTIVITY_TARGET)[keyof typeof ACTIVITY_TARGET];

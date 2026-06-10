import { subtractDays } from './date.util';

export function calculateStreak(
  completedDates: Set<string>,
  fromDate: string,
): number {
  let streak = 0;
  let cursor = fromDate;

  while (completedDates.has(cursor)) {
    streak += 1;
    cursor = subtractDays(cursor, 1);
  }

  return streak;
}

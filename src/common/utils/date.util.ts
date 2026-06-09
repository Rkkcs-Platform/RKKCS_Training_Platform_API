import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { APP_TIMEZONE, DATE_FORMAT } from '../constants/app.constant';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

export function getTodayDate(timezone = APP_TIMEZONE): string {
  return dayjs().tz(timezone).format(DATE_FORMAT);
}

export function isValidDateString(
  date: string,
  format = DATE_FORMAT,
): boolean {
  return dayjs(date, format, true).isValid();
}

export function formatDate(
  date: Date | string,
  format = DATE_FORMAT,
  timezone = APP_TIMEZONE,
): string {
  return dayjs(date).tz(timezone).format(format);
}

export function subtractDays(
  date: string,
  days: number,
  timezone = APP_TIMEZONE,
): string {
  return dayjs(date, DATE_FORMAT).tz(timezone).subtract(days, 'day').format(DATE_FORMAT);
}

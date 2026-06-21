import { randomInt } from 'crypto';
import { CODE_CHARSET } from '../constants/app.constant';

export function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

export function formatCodeForExport(code: string): string {
  return normalizeCode(code).split('').join(' ');
}

export function generateRandomCode(length: number): string {
  let result = '';

  for (let index = 0; index < length; index += 1) {
    result += CODE_CHARSET[randomInt(CODE_CHARSET.length)];
  }

  return result;
}

export function generateUniqueCodes(
  count: number,
  length: number,
): Array<{ code: string; order: number }> {
  const codes = new Set<string>();

  while (codes.size < count) {
    codes.add(generateRandomCode(length));
  }

  return Array.from(codes).map((code, index) => ({
    code,
    order: index + 1,
  }));
}

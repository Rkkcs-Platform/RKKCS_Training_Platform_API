import { formatCodeForExport } from './code.util';

export function escapeCsvValue(value: string | number): string {
  const stringValue = String(value);

  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

export function buildCsv(
  headers: string[],
  rows: Array<Array<string | number>>,
): string {
  const headerLine = headers.map(escapeCsvValue).join(',');
  const dataLines = rows.map((row) =>
    row.map(escapeCsvValue).join(','),
  );

  return [headerLine, ...dataLines].join('\n');
}

export interface ChallengeCodesCsvResult {
  filename: string;
  content: string;
}

export function buildChallengeCodesCsv(
  date: string,
  codes: Array<{ order: number; code: string }>,
): ChallengeCodesCsvResult {
  const sortedCodes = [...codes].sort((left, right) => left.order - right.order);
  const content = buildCsv(
    ['order', 'code'],
    sortedCodes.map((item) => [item.order, formatCodeForExport(item.code)]),
  );

  return {
    filename: `challenge-codes-${date}.csv`,
    content,
  };
}

export function toCsvBuffer(content: string): Buffer {
  return Buffer.from(`\uFEFF${content}`, 'utf-8');
}

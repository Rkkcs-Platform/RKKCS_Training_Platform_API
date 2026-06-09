import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  MAX_LIMIT,
} from '../constants/app.constant';

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function parsePagination(
  page?: number,
  limit?: number,
  maxLimit = MAX_LIMIT,
): PaginationParams {
  const safePage = Math.max(DEFAULT_PAGE, Number(page) || DEFAULT_PAGE);
  const safeLimit = Math.min(
    maxLimit,
    Math.max(1, Number(limit) || DEFAULT_LIMIT),
  );

  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit,
  };
}

export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: total > 0 ? Math.ceil(total / limit) : 0,
  };
}

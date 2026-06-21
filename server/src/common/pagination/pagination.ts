export interface PaginationQuery {
  page?: number | string;
  limit?: number | string;
  pageSize?: number | string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  skip: number;
  take: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

function toPositiveInteger(value: unknown, fallback: number): number {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    return fallback;
  }

  const integerValue = Math.floor(parsedValue);

  if (integerValue < 1) {
    return fallback;
  }

  return integerValue;
}

export function getPaginationOptions(query: PaginationQuery = {}): PaginationOptions {
  const page = toPositiveInteger(query.page, DEFAULT_PAGE);
  const requestedLimit = query.limit ?? query.pageSize;
  const limit = Math.min(toPositiveInteger(requestedLimit, DEFAULT_LIMIT), MAX_LIMIT);
  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
    take: limit,
  };
}

export function buildPaginationMeta(
  options: Pick<PaginationOptions, 'page' | 'limit'>,
  total: number,
): PaginationMeta {
  const totalPages = total > 0 ? Math.ceil(total / options.limit) : 0;

  return {
    page: options.page,
    limit: options.limit,
    total,
    totalPages,
    hasNextPage: options.page < totalPages,
    hasPreviousPage: options.page > 1 && totalPages > 0,
  };
}

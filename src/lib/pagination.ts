export const DEFAULT_PAGE_SIZE = 20;

export function parsePage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const page = Number(raw);
  return Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1;
}

export function parseParam(value: string | string[] | undefined, fallback: string): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && raw.trim() ? raw : fallback;
}

export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export function paginate<T>(items: T[], total: number, page: number, pageSize: number): Paginated<T> {
  return { items, page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

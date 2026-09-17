export type Page = { page: number; pageSize: number };

export function parsePage(query: { page?: string; pageSize?: string }, max = 100): Page {
  const page = Math.max(1, Number(query.page ?? 1) || 1);
  const pageSize = Math.min(max, Math.max(1, Number(query.pageSize ?? 20) || 20));
  return { page, pageSize };
}

export function slicePage<T>(rows: T[], page: Page): { items: T[]; total: number; page: number; pages: number } {
  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / page.pageSize));
  const start = (page.page - 1) * page.pageSize;
  return { items: rows.slice(start, start + page.pageSize), total, page: page.page, pages };
}

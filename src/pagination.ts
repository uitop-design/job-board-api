export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface Page<T> {
  items: T[];
  meta: PageMeta;
}

export function toOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

export function pageMeta(total: number, page: number, limit: number): PageMeta {
  return { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) };
}

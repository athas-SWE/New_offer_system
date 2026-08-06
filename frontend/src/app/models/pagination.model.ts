export interface PageMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PageMeta;
}

export function emptyPageMeta(page = 1, limit = 12): PageMeta {
  return { total: 0, page, limit, totalPages: 0 };
}

export function normalizePageMeta(
  meta?: Partial<PageMeta> | null,
  fallbackPage = 1,
  fallbackLimit = 12,
  itemCount = 0,
): PageMeta {
  const page = Number(meta?.page) || fallbackPage;
  const limit = Number(meta?.limit) || fallbackLimit;
  const total = meta?.total != null ? Number(meta.total) : itemCount;
  const totalPages =
    meta?.totalPages != null
      ? Number(meta.totalPages)
      : limit > 0
        ? Math.ceil(total / limit)
        : 0;
  return { total, page, limit, totalPages };
}

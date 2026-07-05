const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 50;

export const parsePagination = (query = {}) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number.parseInt(query.limit, 10) || DEFAULT_LIMIT),
  );
  const skip = (page - 1) * limit;
  const search = typeof query.search === "string" ? query.search.trim() : "";
  const sort =
    typeof query.sort === "string" && query.sort.trim()
      ? query.sort.trim()
      : "-createdAt";

  return { page, limit, skip, search, sort };
};

export const buildSort = (sortValue) => {
  if (!sortValue) {
    return { createdAt: -1 };
  }

  const direction = sortValue.startsWith("-") ? -1 : 1;
  const field = sortValue.startsWith("-") ? sortValue.slice(1) : sortValue;

  return { [field]: direction };
};

export const buildPaginationMeta = ({ page, limit, totalItems }) => {
  const normalizedLimit = Math.max(1, limit);
  const totalPages = Math.max(1, Math.ceil(totalItems / normalizedLimit));
  const normalizedPage = Math.min(
    Math.max(1, page),
    totalPages,
  );

  return {
    currentPage: normalizedPage,
    totalPages,
    totalItems,
    limit: normalizedLimit,
    hasNextPage: normalizedPage < totalPages,
    hasPrevPage: normalizedPage > 1,
  };
};

export const buildPaginatedResponse = (input = {}, options = {}) => {
  const payload =
    Array.isArray(input) || input === null || input === undefined
      ? { data: input ?? [], page: 1, limit: DEFAULT_LIMIT, totalItems: 0, ...options }
      : { ...input, ...options };

  const {
    data = [],
    page = 1,
    limit = DEFAULT_LIMIT,
    totalItems = 0,
    extra = {},
  } = payload;
  const pagination = buildPaginationMeta({ page, limit, totalItems });

  return {
    data,
    pagination,
    currentPage: pagination.currentPage,
    totalPages: pagination.totalPages,
    totalItems: pagination.totalItems,
    limit: pagination.limit,
    hasNextPage: pagination.hasNextPage,
    hasPrevPage: pagination.hasPrevPage,
    ...extra,
  };
};

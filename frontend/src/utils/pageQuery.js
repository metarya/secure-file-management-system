// Builds the `?page=&size=&sort=&direction=&search=` query string shared by
// every paginated endpoint, omitting params that are null/blank so the backend
// defaults apply. Returns a string starting with "?" (or "" when no params).
export function pageQuery({ page, size, sort, direction, search } = {}) {
  const params = new URLSearchParams();
  if (page != null) params.set("page", page);
  if (size != null) params.set("size", size);
  if (sort) params.set("sort", sort);
  if (direction) params.set("direction", direction);
  if (search && search.trim()) params.set("search", search.trim());
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

// A safe empty page envelope for initial state / error fallbacks.
export const EMPTY_PAGE = {
  content: [],
  page: 0,
  size: 10,
  totalElements: 0,
  totalPages: 0,
  first: true,
  last: true,
};

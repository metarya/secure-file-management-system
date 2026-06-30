import { useCallback, useEffect, useRef, useState } from "react";

const EMPTY_PAGE = {
  content: [],
  page: 0,
  size: 10,
  totalElements: 0,
  totalPages: 0,
  first: true,
  last: true,
};

/**
 * Drives server-side pagination for any list view from one place.
 *
 * It owns the page index, sort and (debounced) search state, enforces the
 * "changing sort or search resets to page 1" rule, and re-fetches whenever any
 * of those change. Callers just provide a `fetcher` that maps the current
 * params to a backend call returning the `PageResponse` envelope
 * ({ content, page, size, totalElements, totalPages, first, last }).
 *
 * @param fetcher  ({ page, size, sort, direction, search }) => Promise<PageResponse>
 * @param options  { initialSort, initialDirection, size, debounceMs, onError }
 */
export default function usePaginatedQuery(fetcher, options = {}) {
  const {
    initialSort = null,
    initialDirection = "desc",
    size = 10,
    debounceMs = 320,
    onError,
  } = options;

  const [page, setPage] = useState(0);
  const [sort, setSort] = useState({ field: initialSort, direction: initialDirection });
  const [search, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [data, setData] = useState({ ...EMPTY_PAGE, size });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Keep the latest fetcher/onError without making the load effect depend on
  // their identity (callers often pass inline closures).
  const fetcherRef = useRef(fetcher);
  const onErrorRef = useRef(onError);
  useEffect(() => { fetcherRef.current = fetcher; }, [fetcher]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  // Debounce the raw search box value.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), debounceMs);
    return () => clearTimeout(t);
  }, [search, debounceMs]);

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetcherRef.current({
        page,
        size,
        sort: sort.field,
        direction: sort.direction,
        search: debouncedSearch,
      });

      // Normalize: tolerate a legacy plain-array response so the hook degrades
      // gracefully if an endpoint hasn't been migrated yet.
      const normalized = res && Array.isArray(res.content)
        ? res
        : {
            ...EMPTY_PAGE,
            size,
            content: Array.isArray(res) ? res : [],
            totalElements: Array.isArray(res) ? res.length : 0,
            totalPages: Array.isArray(res) && res.length ? 1 : 0,
          };

      // If a deletion emptied the current (non-first) page, step back one page
      // and let the effect re-fetch the now-correct page.
      if (normalized.content.length === 0 && page > 0 && normalized.totalElements > 0) {
        setPage((p) => Math.max(0, p - 1));
        return;
      }

      setData(normalized);
    } catch (e) {
      onErrorRef.current?.(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, size, sort.field, sort.direction, debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  // Toggle direction when re-selecting the active column; otherwise switch
  // columns. Always returns to page 1 so the user sees the new ordering's start.
  const handleSort = useCallback((field) => {
    setSort((prev) =>
      prev.field === field
        ? { field, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { field, direction: "asc" });
    setPage(0);
  }, []);

  // Search changes reset to page 1 (the debounce then triggers the re-fetch).
  const setSearch = useCallback((value) => {
    setSearchValue(value);
    setPage(0);
  }, []);

  const goToPage = useCallback((next) => setPage(Math.max(0, next)), []);

  return {
    // data
    rows: data.content,
    meta: {
      page: data.page,
      size: data.size,
      totalElements: data.totalElements,
      totalPages: data.totalPages,
      first: data.first,
      last: data.last,
    },
    loading,
    refreshing,
    // state
    sort,
    search,
    // handlers
    handleSort,
    setSearch,
    goToPage,
    refresh: () => load(true),
    reload: () => load(false),
  };
}

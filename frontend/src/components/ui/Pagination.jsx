import { TablePagination } from "@mui/material";

/**
 * Server-side pagination control, rendered with Material UI's standard
 * {@link TablePagination} component (via `component="div"` so it can live outside
 * a <table>). This gives the default MUI layout — right-aligned:
 *
 *   Rows per page: [10 ▼]      1–10 of 31      ◀ ▶
 *
 * MUI handles the range text ("1–10 of 31"), the icon-only nav arrows, their
 * hover/disabled states, and all spacing/typography. Disabled-on-first/last is
 * derived automatically from `count` / `page` / `rowsPerPage`.
 *
 * Props (zero-based `page`, matching Spring Data):
 *   page            current zero-based page index
 *   size            current page size (rows per page)
 *   totalElements   total record count across all pages
 *   onPageChange(nextPage)         called with the new zero-based page index
 *   onRowsPerPageChange(nextSize)  called with the new page size
 *   rowsPerPageOptions             selectable sizes (default [10, 25, 50])
 *
 * Renders nothing when there are no records.
 */
export default function Pagination({
  page = 0,
  size = 10,
  totalElements = 0,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = [10, 25, 50],
}) {
  if (totalElements === 0) return null;

  // After a rows-per-page change the server-echoed `page` can momentarily exceed
  // the new last page (until the refetch lands). Clamp it so MUI never warns
  // about an out-of-range page; the hook has already reset to page 0.
  const lastPage = Math.max(0, Math.ceil(totalElements / size) - 1);
  const safePage = Math.min(Math.max(page, 0), lastPage);

  return (
    <TablePagination
      component="div"
      count={totalElements}
      page={safePage}
      onPageChange={(_event, nextPage) => onPageChange?.(nextPage)}
      rowsPerPage={size}
      onRowsPerPageChange={(event) =>
        onRowsPerPageChange?.(parseInt(event.target.value, 10))
      }
      rowsPerPageOptions={onRowsPerPageChange ? rowsPerPageOptions : []}
      labelRowsPerPage="Rows per page:"
      sx={{ mt: 1 }}
    />
  );
}

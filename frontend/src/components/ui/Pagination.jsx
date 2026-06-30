import { Box, Button, Typography } from "@mui/material";
import ChevronLeftRounded from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import { tokens } from "../../theme/theme";

/**
 * Reusable server-side pagination control.
 *
 * Works for any paginated view (DataTable-based admin pages AND the card-grid
 * user pages), so the "Showing X–Y of Z · Previous · Page N of M · Next" UI
 * lives in exactly one place.
 *
 * Props (all zero-based `page`, matching Spring Data):
 *   page          current zero-based page index
 *   size          page size
 *   totalElements total record count across all pages
 *   totalPages    total page count
 *   first / last  whether this is the first / last page
 *   onPageChange(nextPage)  called with the new zero-based page index
 *
 * Renders nothing when there's a single page (or no data) — the controls only
 * appear once pagination is meaningful.
 */
export default function Pagination({
  page = 0,
  size = 10,
  totalElements = 0,
  totalPages = 0,
  first = true,
  last = true,
  onPageChange,
}) {
  // Only hide when there's genuinely nothing to show. We deliberately keep the
  // bar visible on a single-page result so the user always sees the record
  // count and page indicator — Previous/Next simply render disabled (via the
  // `first`/`last` flags) rather than the whole control vanishing.
  if (totalElements === 0) return null;

  // Guard against a backend that reports 0 pages for a non-empty result.
  const pageCount = Math.max(totalPages, 1);

  // Human-friendly 1-based "Showing X–Y of Z".
  const from = page * size + 1;
  const to = Math.min((page + 1) * size, totalElements);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 1.5,
        mt: 2.5,
        px: { xs: 0.5, sm: 1 },
      }}
    >
      <Typography sx={{ color: tokens.textDim, fontSize: "0.82rem" }} className="tnum">
        Showing {from}–{to} of {totalElements} record{totalElements === 1 ? "" : "s"}
      </Typography>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<ChevronLeftRounded />}
          disabled={first}
          onClick={() => onPageChange?.(page - 1)}
          sx={{ textTransform: "none", borderColor: tokens.border, color: tokens.textDim }}
        >
          Previous
        </Button>

        <Typography sx={{ color: tokens.text, fontSize: "0.82rem", fontWeight: 600 }} className="tnum">
          Page {page + 1} of {pageCount}
        </Typography>

        <Button
          size="small"
          variant="outlined"
          endIcon={<ChevronRightRounded />}
          disabled={last}
          onClick={() => onPageChange?.(page + 1)}
          sx={{ textTransform: "none", borderColor: tokens.border, color: tokens.textDim }}
        >
          Next
        </Button>
      </Box>
    </Box>
  );
}

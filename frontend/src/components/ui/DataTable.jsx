import { useState } from "react";
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, TextField, InputAdornment, Skeleton, Typography, useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import SearchRounded from "@mui/icons-material/SearchRounded";
import { tokens } from "../../theme/theme";
import EmptyState from "./EmptyState";

/**
 * columns: [{ key, label, align?, width?, render?(row) }]
 * rows:    array of records
 *
 * Responsive: on screens below the `sm` breakpoint the table collapses into a
 * stacked card list (one card per row, label/value pairs) so nothing overflows
 * horizontally on phones. On larger screens it renders a normal table.
 */
export default function DataTable({
  columns, rows, loading, getRowKey,
  searchable = false, searchPlaceholder = "Search…", onSearchChange, searchValue,
  toolbarRight, empty, rowsPerPageOptions = [10, 25, 50], dense = false,
  sortField, sortDirection, onSortChange,
  // Server-side pagination: when true the table renders `rows` exactly as given
  // (the parent has already fetched a single page) and the built-in client-side
  // pager is suppressed — the parent renders <Pagination/> beneath the table.
  serverMode = false,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageOptions[0]);

  const paged = serverMode ? rows : rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // A column with no visible label (e.g. the row-actions menu) is treated as the
  // card's top-right action slot on mobile rather than a labelled field.
  const actionColumn = columns.find((c) => !c.label);
  const labelledColumns = columns.filter((c) => c.label);
  const cellValue = (col, row) => (col.render ? col.render(row) : (row[col.key] ?? "—"));

  // A column opts into server-side sorting by declaring `sortKey`. When the
  // parent also provides `onSortChange`, the header becomes a clickable control
  // with an indicator: ⇅ (not sorted), ↑ (asc), ↓ (desc). Columns without a
  // sortKey — or tables that don't pass onSortChange — render plain labels, so
  // every other page using DataTable is unaffected.
  const renderHeaderLabel = (col) => {
    if (!col.sortKey || !onSortChange) return col.label;
    const active = sortField === col.sortKey;
    const indicator = !active ? "⇅" : sortDirection === "asc" ? "↑" : "↓";
    return (
      <Box
        component="span"
        role="button"
        tabIndex={0}
        onClick={() => onSortChange(col.sortKey)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSortChange(col.sortKey); } }}
        sx={{
          cursor: "pointer", userSelect: "none", display: "inline-flex",
          alignItems: "center", gap: 0.5,
          color: active ? tokens.text : "inherit",
          "&:hover": { color: tokens.text },
        }}
      >
        {col.label}
        <Box component="span" sx={{ fontSize: "0.78rem", color: active ? tokens.accent : tokens.textFaint }}>
          {indicator}
        </Box>
      </Box>
    );
  };

  const renderMobileCards = () => (
    <Box sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
      {loading &&
        Array.from({ length: 4 }).map((_, i) => (
          <Box key={`msk-${i}`} sx={{ p: 2, borderRadius: "14px", border: `1px solid ${tokens.border}`, background: tokens.surface }}>
            <Skeleton variant="text" width="60%" sx={{ bgcolor: tokens.surfaceHover, mb: 1 }} />
            <Skeleton variant="text" width="40%" sx={{ bgcolor: tokens.surfaceHover }} />
          </Box>
        ))}

      {!loading &&
        paged.map((row, idx) => (
          <Box
            key={getRowKey ? getRowKey(row) : idx}
            sx={{
              p: 2, borderRadius: "14px", border: `1px solid ${tokens.border}`,
              background: tokens.surface, backdropFilter: "blur(14px)",
            }}
          >
            {/* Header: first labelled column + optional action menu */}
            <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1, mb: labelledColumns.length > 1 ? 1.5 : 0 }}>
              <Box sx={{ minWidth: 0, flex: 1 }}>{labelledColumns[0] && cellValue(labelledColumns[0], row)}</Box>
              {actionColumn && <Box sx={{ flexShrink: 0, mt: -0.5, mr: -0.5 }}>{cellValue(actionColumn, row)}</Box>}
            </Box>

            {/* Remaining fields as label / value rows */}
            {labelledColumns.slice(1).map((col) => (
              <Box
                key={col.key}
                sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, py: 0.6, borderTop: `1px solid ${tokens.border}` }}
              >
                <Typography sx={{ color: tokens.textFaint, fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", flexShrink: 0 }}>
                  {col.label}
                </Typography>
                <Box sx={{ minWidth: 0, flex: 1, display: "flex", justifyContent: "flex-end", textAlign: "right" }}>
                  {cellValue(col, row)}
                </Box>
              </Box>
            ))}
          </Box>
        ))}
    </Box>
  );

  return (
    <Paper sx={{ borderRadius: "18px", overflow: "hidden", boxShadow: tokens.shadow }}>
      {(searchable || toolbarRight) && (
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap", p: 2, borderBottom: `1px solid ${tokens.border}` }}>
          {searchable && (
            <TextField
              size="small"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => { onSearchChange?.(e.target.value); if (!serverMode) setPage(0); }}
              sx={{ flex: 1, minWidth: 180 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRounded sx={{ color: tokens.textFaint, fontSize: 19 }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
          )}
          <Box sx={{ display: "flex", gap: 1, ml: searchable ? 0 : "auto" }}>{toolbarRight}</Box>
        </Box>
      )}

      {isMobile ? (
        renderMobileCards()
      ) : (
        <TableContainer>
          <Table size={dense ? "small" : "medium"}>
            <TableHead>
              <TableRow>
                {columns.map((c) => (
                  <TableCell key={c.key} align={c.align || "left"} sx={{ width: c.width }}>
                    {renderHeaderLabel(c)}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={`sk-${i}`}>
                    {columns.map((c) => (
                      <TableCell key={c.key} align={c.align || "left"}>
                        <Skeleton variant="text" sx={{ bgcolor: tokens.surfaceHover }} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

              {!loading &&
                paged.map((row, idx) => (
                  <TableRow key={getRowKey ? getRowKey(row) : idx} hover>
                    {columns.map((c) => (
                      <TableCell key={c.key} align={c.align || "left"} sx={{ color: tokens.text }}>
                        {c.render ? c.render(row) : <Typography sx={{ fontSize: "0.9rem" }}>{row[c.key] ?? "—"}</Typography>}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {!loading && rows.length === 0 && (
        empty || <EmptyState title="Nothing here yet" description="There's no data to show." />
      )}

      {!serverMode && !loading && rows.length > rowsPerPageOptions[0] && (
        <TablePagination
          component="div"
          count={rows.length}
          page={page}
          onPageChange={(_e, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={rowsPerPageOptions}
          sx={{ borderTop: `1px solid ${tokens.border}`, color: tokens.textDim }}
        />
      )}
    </Paper>
  );
}

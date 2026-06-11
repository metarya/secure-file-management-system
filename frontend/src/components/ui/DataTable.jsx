import { useState } from "react";
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, TextField, InputAdornment, Skeleton, Typography,
} from "@mui/material";
import SearchRounded from "@mui/icons-material/SearchRounded";
import { tokens } from "../../theme/theme";
import EmptyState from "./EmptyState";

/**
 * columns: [{ key, label, align?, width?, render?(row) }]
 * rows:    array of records
 */
export default function DataTable({
  columns, rows, loading, getRowKey,
  searchable = false, searchPlaceholder = "Search…", onSearchChange, searchValue,
  toolbarRight, empty, rowsPerPageOptions = [10, 25, 50], dense = false,
}) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageOptions[0]);

  const paged = rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Paper sx={{ borderRadius: "18px", overflow: "hidden" }}>
      {(searchable || toolbarRight) && (
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap", p: 2, borderBottom: `1px solid ${tokens.border}` }}>
          {searchable && (
            <TextField
              size="small"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => { onSearchChange?.(e.target.value); setPage(0); }}
              sx={{ flex: 1, minWidth: 220 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRounded sx={{ color: tokens.textFaint, fontSize: 19 }} />
                  </InputAdornment>
                ),
              }}
            />
          )}
          <Box sx={{ display: "flex", gap: 1, ml: searchable ? 0 : "auto" }}>{toolbarRight}</Box>
        </Box>
      )}

      <TableContainer>
        <Table size={dense ? "small" : "medium"}>
          <TableHead>
            <TableRow>
              {columns.map((c) => (
                <TableCell key={c.key} align={c.align || "left"} sx={{ width: c.width }}>
                  {c.label}
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
                      <Skeleton variant="text" sx={{ bgcolor: "rgba(255,255,255,0.06)" }} />
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

      {!loading && rows.length === 0 && (
        empty || <EmptyState title="Nothing here yet" description="There's no data to show." />
      )}

      {!loading && rows.length > rowsPerPageOptions[0] && (
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

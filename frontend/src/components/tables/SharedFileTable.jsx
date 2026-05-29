import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Link
} from "@mui/material";

export default function SharedFileTable({
  files,
  previewFile,
  downloadFile
}) {
  if (!files || files.length === 0) {
    return (
    <Paper
      sx={{
        p: 3,
        textAlign: "center",
        color: "#64748b",
        backgroundColor: "#f8fafc",
        border: "1px dashed #cbd5e1",
        borderRadius: 2
      }}
    >
      No shared files found.
    </Paper>
    );
  }

  return (
    <TableContainer
      component={Paper}
      sx={{
        borderRadius: 3,
        border: "1px solid #e5e7eb",
        overflow: "hidden"
      }}
    >
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>File Name</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Shared By</TableCell>
            <TableCell>Permission</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {files.map((file) => (
            <TableRow key={file.fileId} hover>
              <TableCell>
                <Link
                  component="button"
                  underline="hover"
                  onClick={() => previewFile(file)}
                  sx={{
                    fontWeight: 600,
                    textAlign: "left"
                  }}
                >
                  {file.fileName ||
                    file.name ||
                    "Unnamed file"}
                </Link>
              </TableCell>

              <TableCell>
                {file.description ||
                  "No description"}
              </TableCell>

              <TableCell>
                {file.ownerEmail ||
                  file.sharedBy ||
                  "-"}
              </TableCell>

              <TableCell>
                <Chip
                  label={file.permission || "SHARED"}
                  size="small"
                  sx={{
                    fontWeight: 600,
                    backgroundColor: "#dbeafe",
                    color: "#1e3a8a"
                  }}
                />
              </TableCell>

              <TableCell>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => downloadFile(file)}
                  sx={{
                    backgroundColor: "#e5e7eb",
                    color: "#111827",
                    boxShadow: "none",
                    "&:hover": {
                      backgroundColor: "#d1d5db",
                      boxShadow: "none"
                    }
                  }}
                >
                  Download
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

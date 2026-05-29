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
  Stack,
  Link
} from "@mui/material";

export default function FileTable({
  files,
  downloadFile,
  deleteFile,
  toggleVisibility,
  previewFile
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
      No files found. Click Refresh after uploading files.
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
            <TableCell>Visibility</TableCell>
            <TableCell>Uploaded At</TableCell>
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
                {file.sharedFile?.description ||
                  file.description ||
                  "-"}
              </TableCell>

              <TableCell>
                <Chip
                  label={
                    file.sharedAt
                      ? "SHARED"
                      : file.visibility
                  }
                  size="small"
                  sx={{
                    fontWeight: 600,
                    backgroundColor: file.sharedAt
                      ? "#dbeafe"
                      : file.visibility === "PUBLIC"
                      ? "#d1fae5"
                      : "#fee2e2",
                    color: file.sharedAt
                      ? "#1e3a8a"
                      : file.visibility === "PUBLIC"
                      ? "#065f46"
                      : "#991b1b"
                  }}
                />
              </TableCell>

              <TableCell>
                {file.uploadedAt || "-"}
              </TableCell>

              <TableCell>
                <Stack
                  direction="row"
                  spacing={1}
                  flexWrap="wrap"
                >
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

                  {!file.sharedAt && (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => toggleVisibility(file)}
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
                      Make {file.visibility === "PUBLIC"
                        ? "PRIVATE"
                        : "PUBLIC"}
                    </Button>
                  )}

                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => deleteFile(file)}
                    sx={{
                      backgroundColor: "#dc2626",
                      color: "#ffffff",
                      boxShadow: "none",
                      "&:hover": {
                        backgroundColor: "#b91c1c",
                        boxShadow: "none"
                      }
                    }}
                  >
                    {file.sharedAt
                      ? "Remove"
                      : "Delete"}
                  </Button>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

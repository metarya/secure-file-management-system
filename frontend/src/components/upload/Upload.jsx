import {
  Box,
  Typography,
  TextField,
  Button,
  Stack
} from "@mui/material";

import UploadFileIcon from "@mui/icons-material/UploadFile";

export default function Upload({
  FileName,
  setFileName,
  FileDescription,
  setFileDescription,
  setFile,
  uploadFile
}) {
  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: {
          xs: "100%",
          sm: "480px",
          md: "520px"
        }
      }}
    >
      {/* Heading */}

      <Typography
        sx={{
          fontWeight: 700,
          mb: 1.5,
          fontSize: {
            xs: "1.3rem",
            sm: "1.5rem",
            md: "1.6rem"
          },
          color: "#0f172a"
        }}
      >
        File Upload
      </Typography>

      <Stack
        spacing={{
          xs: 2,
          sm: 2.2
        }}
      >
        {/* File Name */}

        <Box>
          <Typography
            sx={{
              fontWeight: 600,
              mb: 0.6,
              fontSize: "0.82rem",
              color: "#111827"
            }}
          >
            File Name
          </Typography>

          <TextField
            fullWidth
            size="small"
            placeholder="Enter file name"
            value={FileName}
            onChange={(e) => setFileName(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                height: {
                  xs: 44,
                  sm: 40
                },
                borderRadius: "12px",

                "& fieldset": {
                  borderColor: "#d6dbe4"
                }
              },

              "& input": {
                fontSize: "14px"
              }
            }}
          />
        </Box>

        {/* Description */}

        <Box>
          <Typography
            sx={{
              fontWeight: 600,
              mb: 0.6,
              fontSize: "0.82rem",
              color: "#111827"
            }}
          >
            Description
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Enter file description"
            value={FileDescription}
            onChange={(e) =>
              setFileDescription(e.target.value)
            }
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",

                "& fieldset": {
                  borderColor: "#d6dbe4"
                }
              },

              "& textarea": {
                fontSize: "14px",
                padding: "12px"
              }
            }}
          />
        </Box>

        {/* File Upload */}

        <Box>
          <Button
            component="label"
            variant="outlined"
            fullWidth
            startIcon={<UploadFileIcon />}
            sx={{
              height: {
                xs: 44,
                sm: 38
              },

              width: {
                xs: "100%",
                sm: "auto"
              },

              borderRadius: "12px",
              px: 2,

              fontSize: {
                xs: "0.9rem",
                sm: "0.8rem"
              },

              textTransform: "none",
              fontWeight: 500,
              borderColor: "#cbd5e1",
              color: "#2563eb"
            }}
          >
            Choose File

            <input
              hidden
              type="file"
              accept=".txt"
              onChange={(e) =>
                setFile(e.target.files[0])
              }
            />
          </Button>
        </Box>

        {/* Upload Button */}

        <Button
          variant="contained"
          onClick={uploadFile}
          sx={{
            height: {
              xs: 48,
              sm: 40
            },

            borderRadius: "12px",
            fontWeight: 600,

            fontSize: {
              xs: "0.95rem",
              sm: "0.85rem"
            },

            backgroundColor: "#1d4ed8",
            boxShadow: "none",
            textTransform: "none",

            "&:hover": {
              backgroundColor: "#1e40af",
              boxShadow: "none"
            }
          }}
        >
          Upload File
        </Button>
      </Stack>
    </Box>
  );
}
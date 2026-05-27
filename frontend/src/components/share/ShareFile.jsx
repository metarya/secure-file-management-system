import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  MenuItem
} from "@mui/material";

export default function ShareFile({
  files,
  shareFileId,
  setShareFileId,
  targetUserEmail,
  setTargetUserEmail,
  permissionType,
  setPermissionType,
  shareFileAccess,
  shareMessage
}) {

  return (

    <Box
      sx={{
        width: "100%",
        maxWidth: "420px"
      }}
    >

      {/* Heading */}

      <Typography
        sx={{
          fontWeight: 700,
          mb: 1.5,
          fontSize: "1.5rem",
          color: "#0f172a"
        }}
      >
        Share File Access
      </Typography>

      <Stack spacing={1.8}>

        {/* File Select */}

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
            select
            fullWidth
            size="small"
            value={shareFileId}
            onChange={(e) =>
              setShareFileId(
                e.target.value
              )
            }
            sx={{
              "& .MuiOutlinedInput-root": {
                height: "40px",
                borderRadius: "12px",

                "& fieldset": {
                  borderColor: "#d6dbe4"
                }
              },

              "& .MuiSelect-select": {
                fontSize: "14px"
              }
            }}
          >

            <MenuItem value="">
              Select file to share
            </MenuItem>

            {files.map((file) => {

              const optionFileId =
                file.fileId || file.id;

              return (

                <MenuItem
                  key={optionFileId}
                  value={optionFileId}
                >
                  {file.fileName}
                </MenuItem>

              );
            })}

          </TextField>

        </Box>

        {/* Email */}

        <Box>

          <Typography
            sx={{
              fontWeight: 600,
              mb: 0.6,
              fontSize: "0.82rem",
              color: "#111827"
            }}
          >
            User Email
          </Typography>

          <TextField
            fullWidth
            size="small"
            type="email"
            placeholder="Enter target user email"
            value={targetUserEmail}
            onChange={(e) =>
              setTargetUserEmail(
                e.target.value
              )
            }
            sx={{
              "& .MuiOutlinedInput-root": {
                height: "40px",
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

        {/* Permission */}

        <Box>

          <Typography
            sx={{
              fontWeight: 600,
              mb: 0.6,
              fontSize: "0.82rem",
              color: "#111827"
            }}
          >
            Permission Type
          </Typography>

          <TextField
            select
            fullWidth
            size="small"
            value={permissionType}
            onChange={(e) =>
              setPermissionType(
                e.target.value
              )
            }
            sx={{
              "& .MuiOutlinedInput-root": {
                height: "40px",
                borderRadius: "12px",

                "& fieldset": {
                  borderColor: "#d6dbe4"
                }
              },

              "& .MuiSelect-select": {
                fontSize: "14px"
              }
            }}
          >

            <MenuItem value="VIEW">
              View Only
            </MenuItem>

            <MenuItem value="DOWNLOAD">
              View + Download
            </MenuItem>

          </TextField>

        </Box>

        {/* Button */}

        <Button
          variant="contained"
          onClick={shareFileAccess}
          sx={{
            height: "40px",
            borderRadius: "12px",
            fontWeight: 600,
            fontSize: "0.85rem",
            backgroundColor: "#1d4ed8",
            boxShadow: "none",
            textTransform: "none",

            "&:hover": {
              backgroundColor: "#1e40af",
              boxShadow: "none"
            }
          }}
        >
          Share File
        </Button>

        {/* Message */}

        {shareMessage && (

          <Typography
            sx={{
              fontSize: "13px",
              color: "#2563eb",
              mt: 0.5
            }}
          >
            {shareMessage}
          </Typography>

        )}

      </Stack>

    </Box>
  );
}
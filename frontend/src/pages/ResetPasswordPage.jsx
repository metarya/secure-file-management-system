import { useState } from "react";

import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  Alert
} from "@mui/material";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8080/api";

export default function ResetPasswordPage({ setPage }) {
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");

  const [token, setToken] = useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [verified, setVerified] =
    useState(false);

  async function sendResetLink() {
    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/forgot-password`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email,
          }),
        }
      );

      const data = await response.text();

      setMessage(data);

      setStep(2);
    } catch {
      setMessage(
        "Failed to send reset link"
      );
    }
  }

  async function resetPassword() {
    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/reset-password`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            token,
            newPassword,
          }),
        }
      );

      const data = await response.text();

      setMessage(data);
    } catch {
      setMessage(
        "Password reset failed"
      );
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        backgroundColor: "#eef2f7",

        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        px: 2,
        py: 0
      }}
    >
      <Container
        maxWidth="xs"
        disableGutters
      >
        <Paper
          elevation={0}
          sx={{
            p: {
              xs: 2.5,
              sm: 3,
              md: 4
            },

            borderRadius: {
              xs: 3,
              sm: 5
            },

            backgroundColor:
              "#ffffff",

            border:
              "1px solid #dbe2ea",

            boxShadow:
              "0 8px 24px rgba(15,23,42,0.06)"
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              mb: 1,
              color: "#0f172a",

              fontSize: {
                xs: "1.8rem",
                sm: "2.125rem"
              }
            }}
          >
            Reset Password
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: "#64748b",

              mb: {
                xs: 3,
                sm: 4
              },

              fontSize: {
                xs: "0.95rem",
                sm: "1rem"
              }
            }}
          >
            Recover your account access
          </Typography>

          <Stack
            spacing={{
              xs: 3,
              sm: 3.5
            }}
          >
            {step === 1 && (
              <>
                <TextField
                  fullWidth
                  label="Registered Email"
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(
                      e.target.value
                    )
                  }
                  sx={{
                    "& .MuiOutlinedInput-root":
                      {
                        borderRadius: 4,
                        height: 56
                      }
                  }}
                />

                <Button
                  variant="contained"
                  fullWidth
                  onClick={sendResetLink}
                  sx={{
                    height: 56,

                    borderRadius: 4,

                    fontSize: {
                      xs: "1rem",
                      sm: "1.05rem"
                    },

                    fontWeight: 700,

                    backgroundColor:
                      "#1d4ed8",

                    boxShadow: "none",

                    "&:hover": {
                      backgroundColor:
                        "#1e40af",

                      boxShadow: "none"
                    }
                  }}
                >
                  Send Code
                </Button>
              </>
            )}

            {step === 2 && !verified && (
              <>
                <TextField
                  fullWidth
                  label="Verification Code"
                  value={token}
                  onChange={(e) =>
                    setToken(
                      e.target.value
                    )
                  }
                  sx={{
                    "& .MuiOutlinedInput-root":
                      {
                        borderRadius: 4,
                        height: 56
                      }
                  }}
                />

                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => {
                    if (!token) {
                      setMessage(
                        "Enter token"
                      );
                      return;
                    }

                    setVerified(true);
                  }}
                  sx={{
                    height: 56,

                    borderRadius: 4,

                    fontSize: {
                      xs: "1rem",
                      sm: "1.05rem"
                    },

                    fontWeight: 700,

                    backgroundColor:
                      "#1d4ed8",

                    boxShadow: "none",

                    "&:hover": {
                      backgroundColor:
                        "#1e40af",

                      boxShadow: "none"
                    }
                  }}
                >
                  Verify
                </Button>
              </>
            )}

            {verified && (
              <>
                <TextField
                  fullWidth
                  label="New Password"
                  type="password"
                  value={newPassword}
                  onChange={(e) =>
                    setNewPassword(
                      e.target.value
                    )
                  }
                  sx={{
                    "& .MuiOutlinedInput-root":
                      {
                        borderRadius: 4,
                        height: 56
                      }
                  }}
                />

                <Button
                  variant="contained"
                  fullWidth
                  onClick={resetPassword}
                  sx={{
                    height: 56,

                    borderRadius: 4,

                    fontSize: {
                      xs: "1rem",
                      sm: "1.05rem"
                    },

                    fontWeight: 700,

                    backgroundColor:
                      "#1d4ed8",

                    boxShadow: "none",

                    "&:hover": {
                      backgroundColor:
                        "#1e40af",

                      boxShadow: "none"
                    }
                  }}
                >
                  Reset Password
                </Button>
              </>
            )}

            <Typography
              sx={{
                textAlign: "center",
                color: "#475569",

                fontSize: {
                  xs: "0.95rem",
                  sm: "1rem"
                }
              }}
            >
              Back to Login?{" "}
              <Box
                component="span"
                onClick={() =>
                  setPage("login")
                }
                sx={{
                  color: "#2563eb",
                  cursor: "pointer",
                  fontWeight: 700,

                  "&:hover": {
                    textDecoration:
                      "underline"
                  }
                }}
              >
                Login
              </Box>
            </Typography>

            {message && (
              <Alert
                severity="info"
                sx={{
                  borderRadius: 3
                }}
              >
                {message}
              </Alert>
            )}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
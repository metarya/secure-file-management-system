import { useEffect, useState } from "react";

import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Stack,
  Container
} from "@mui/material";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8080/api";

export default function LoginPage({
  setUser,
  setPage
}) {
  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    if (!message) return;

    const toastTimer =
      setTimeout(() => {
        setMessage("");
      }, 3500);

    return () =>
      clearTimeout(toastTimer);
  }, [message]);

  async function loginUser() {
    try {
      const response =
        await fetch(
          `${API_BASE_URL}/auth/login`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              email,
              password
            })
          }
        );

      const data =
        await response.json();

      if (
        response.ok &&
        data.userId
      ) {
        localStorage.setItem(
          "sfmsUser",
          JSON.stringify(data)
        );

        localStorage.setItem(
          "sfms_user",
          JSON.stringify(data)
        );

        setUser(data);
      } else {
        setMessage(
          data.message ||
          "Login failed"
        );
      }
    } catch (error) {
      setMessage(
        "Login failed: " +
        error.message
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
              sm: 4
            },

            backgroundColor:
              "#ffffff",

            border:
              "1px solid #dbe2ea",

            boxShadow:
              "0 8px 30px rgba(15, 23, 42, 0.08)"
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
            Login
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: "#64748b",

              mb: {
                xs: 3,
                sm: 5
              },

              fontSize: {
                xs: "0.95rem",
                sm: "1rem"
              }
            }}
          >
            Sign in to continue
          </Typography>

          <Stack
            spacing={{
              xs: 3,
              sm: 4
            }}
          >
            <TextField
              label="Email"
              type="email"
              fullWidth
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
                    height: 48
                  }
              }}
            />

            <TextField
              label="Password"
              type="password"
              fullWidth
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              sx={{
                "& .MuiOutlinedInput-root":
                  {
                    borderRadius: 4,
                    height: 48
                  }
              }}
            />

            <Box
              sx={{
                display: "flex",
                justifyContent:
                  "flex-end",

                mt: -1
              }}
            >
              <Typography
                onClick={() =>
                  setPage(
                    "reset-password"
                  )
                }
                sx={{
                  color: "#2563eb",
                  cursor: "pointer",
                  fontWeight: 600,

                  fontSize: {
                    xs: "0.9rem",
                    sm: "1rem"
                  },

                  "&:hover": {
                    textDecoration:
                      "underline"
                  }
                }}
              >
                Forgot Password?
              </Typography>
            </Box>

            <Button
              variant="contained"
              fullWidth
              onClick={loginUser}
              sx={{
                height: 48,

                borderRadius: 4,

                fontSize: {
                  xs: "1rem",
                  sm: "1.1rem"
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
              Login
            </Button>

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
              New user?{" "}
              <Box
                component="span"
                onClick={() =>
                  setPage(
                    "register"
                  )
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
                Register
              </Box>
            </Typography>

            {message && (
              <Alert
                severity="error"
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
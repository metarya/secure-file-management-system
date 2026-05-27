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
        minHeight: "100vh",
        backgroundColor: "#eef2f7",

        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        px: 2
      }}
    >

      <Container maxWidth="xs">

        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 4,

            backgroundColor:
              "#ffffff",

            border:
              "1px solid #dbe2ea",

            boxShadow:
              "0 8px 30px rgba(15, 23, 42, 0.08)"
          }}
        >

          {/* Heading */}

          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              mb: 1,
              color: "#0f172a"
            }}
          >
            Login
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: "#64748b",
              mb: 5
            }}
          >
            Sign in to continue
          </Typography>

          {/* Form */}

          <Stack spacing={4}>

            {/* Email */}

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
                    height: "48px"
                  }
              }}
            />

            {/* Password */}

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
                    height: "48px"
                  }
              }}
            />

            {/* Forgot Password */}

            <Box
              sx={{
                display: "flex",
                justifyContent:
                  "flex-end",

                mt: -2
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

                  "&:hover": {
                    textDecoration:
                      "underline"
                  }
                }}
              >
                Forgot Password?
              </Typography>

            </Box>

            {/* Login Button */}

            <Button
              variant="contained"
              fullWidth
              onClick={loginUser}

              sx={{
                height: "48px",

                borderRadius: 4,

                fontSize: "1.1rem",

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

            {/* Register */}

            <Typography
              sx={{
                textAlign: "center",
                color: "#475569"
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

            {/* Error Message */}

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
import { useEffect, useState } from "react";

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

export default function RegisterPage({
  setPage
}) {

  const [fullName, setFullName] =
    useState("");

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

  async function registerUser() {

    try {

      const response =
        await fetch(
          `${API_BASE_URL}/auth/register`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              fullName,
              email,
              password
            })
          }
        );

      const text =
        await response.text();

      setMessage(text);

      if (
        response.ok &&
        text
          .toLowerCase()
          .includes("success")
      ) {

        setTimeout(() => {
          setPage("login");
        }, 900);
      }

    } catch (error) {

      setMessage(
        "Registration failed: " +
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
            p: 4,
            borderRadius: 5,

            backgroundColor:
              "#ffffff",

            border:
              "1px solid #dbe2ea",

            boxShadow:
              "0 8px 24px rgba(15,23,42,0.06)"
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
            Create Account
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: "#64748b",
              mb: 4
            }}
          >
            Register to continue
          </Typography>

          {/* Form */}

          <Stack spacing={3}>

            {/* Full Name */}

            <TextField
              fullWidth
              label="Full Name"

              value={fullName}

              onChange={(e) =>
                setFullName(
                  e.target.value
                )
              }

              sx={{
                "& .MuiOutlinedInput-root":
                  {
                    borderRadius: 4,
                    height: "56px"
                  }
              }}
            />

            {/* Email */}

            <TextField
              fullWidth
              label="Email"
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
                    height: "56px"
                  }
              }}
            />

            {/* Password */}

            <TextField
              fullWidth
              label="Password"
              type="password"

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
                    height: "56px"
                  }
              }}
            />

            {/* Register Button */}

            <Button
              variant="contained"
              fullWidth
              onClick={registerUser}

              sx={{
                height: "56px",

                borderRadius: 4,

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
              Register
            </Button>

            {/* Login Link */}

            <Typography
              sx={{
                textAlign: "center",
                color: "#475569",
                fontSize: "0.95rem"
              }}
            >
              Already have an account?{" "}

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

            {/* Message */}

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
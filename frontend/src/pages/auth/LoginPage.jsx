import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Box, TextField, Button, Alert, Stack, InputAdornment, IconButton, CircularProgress, Typography } from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

import AuthLayout, { FieldLabel } from "../../components/ui/AuthLayout";
import { login } from "../../api/authApi";
import { loadStoredUser, storeUser, homeRouteForUser } from "../../utils/auth";
import { tokens } from "../../theme/theme";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = loadStoredUser();
    if (stored?.userId && stored?.token) navigate(homeRouteForUser(stored), { replace: true });
  }, []); // eslint-disable-line

  async function submit() {
    if (!email.trim() || !password) { setError("Enter your email and password."); return; }
    setLoading(true); setError("");
    try {
      const { ok, data } = await login(email.trim(), password);
      if (ok && data.userId) {
        storeUser(data);
        navigate(homeRouteForUser(loadStoredUser()), { replace: true });
      } else {
        setError(data.message || "Invalid email or password.");
      }
    } catch {
      setError("Couldn't reach the server. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your account">
      <Stack component="form" spacing={2.5} onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <Box>
          <FieldLabel>Email</FieldLabel>
          <TextField fullWidth size="small" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Box>
        <Box>
          <FieldLabel right={<Typography component={Link} to="/reset-password" sx={{ color: tokens.accent, fontSize: "0.76rem", fontWeight: 600, textDecoration: "none" }}>Forgot password?</Typography>}>
            Password
          </FieldLabel>
          <TextField
            fullWidth size="small" type={showPw ? "text" : "password"} placeholder="••••••••"
            value={password} onChange={(e) => setPassword(e.target.value)}
            slotProps={{ input: { endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPw((p) => !p)} edge="end" sx={{ color: tokens.textFaint }}>
                  {showPw ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                </IconButton>
              </InputAdornment>
            ) } }}
          />
        </Box>

        {error && <Alert severity="error" sx={{ borderRadius: "12px", fontSize: "0.85rem", py: 0.5 }}>{error}</Alert>}

        <Button type="submit" variant="contained" fullWidth disabled={loading} sx={{ height: 48, mt: 0.5 }}>
          {loading ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : "Sign in"}
        </Button>

        <Typography sx={{ textAlign: "center", color: tokens.textFaint, fontSize: "0.88rem" }}>
          New here?{" "}
          <Box component={Link} to="/register" sx={{ color: tokens.accent, fontWeight: 700, textDecoration: "none" }}>Create an account</Box>
        </Typography>
      </Stack>
    </AuthLayout>
  );
}

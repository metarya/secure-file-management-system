import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Box, TextField, Button, Alert, Stack, InputAdornment, IconButton, CircularProgress, Typography } from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";

import AuthLayout, { FieldLabel } from "../../components/ui/AuthLayout";
import { register } from "../../api/authApi";
import { tokens } from "../../theme/theme";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function submit() {
    if (!fullName.trim() || !email.trim() || !password) {
      setFeedback({ type: "error", text: "All fields are required." });
      return;
    }
    if (password.length < 6) {
      setFeedback({ type: "error", text: "Use at least 6 characters for your password." });
      return;
    }
    setLoading(true); setFeedback({ type: "", text: "" });
    try {
      const { ok, message } = await register(fullName.trim(), email.trim(), password);
      if (ok) {
        setFeedback({ type: "success", text: "Account created. Redirecting to sign in…" });
        setTimeout(() => navigate("/login"), 1200);
      } else {
        setFeedback({ type: "error", text: message || "Couldn't create your account." });
      }
    } catch {
      setFeedback({ type: "error", text: "Couldn't reach the server. Try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Start managing your files securely">
      <Stack spacing={2.25} onKeyDown={(e) => e.key === "Enter" && submit()}>
        <Box>
          <FieldLabel>Full name</FieldLabel>
          <TextField fullWidth size="small" placeholder="Jane Cooper" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </Box>
        <Box>
          <FieldLabel>Email</FieldLabel>
          <TextField fullWidth size="small" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Box>
        <Box>
          <FieldLabel>Password</FieldLabel>
          <TextField
            fullWidth size="small" type={showPw ? "text" : "password"} placeholder="At least 6 characters"
            value={password} onChange={(e) => setPassword(e.target.value)}
            InputProps={{ endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPw((p) => !p)} edge="end" sx={{ color: tokens.textFaint }}>
                  {showPw ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                </IconButton>
              </InputAdornment>
            ) }}
          />
        </Box>

        {feedback.text && (
          <Alert
            severity={feedback.type === "success" ? "success" : "error"}
            icon={feedback.type === "success" ? <CheckCircleRounded /> : undefined}
            sx={{ borderRadius: "12px", fontSize: "0.85rem", py: 0.5 }}
          >
            {feedback.text}
          </Alert>
        )}

        <Button variant="contained" fullWidth onClick={submit} disabled={loading} sx={{ height: 48, mt: 0.5 }}>
          {loading ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : "Create account"}
        </Button>

        <Typography sx={{ textAlign: "center", color: tokens.textFaint, fontSize: "0.88rem" }}>
          Already have an account?{" "}
          <Box component={Link} to="/login" sx={{ color: tokens.accent, fontWeight: 700, textDecoration: "none" }}>Sign in</Box>
        </Typography>
      </Stack>
    </AuthLayout>
  );
}

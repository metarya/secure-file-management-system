import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Box, TextField, Button, Alert, Stack, InputAdornment, IconButton, CircularProgress, Typography } from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import MarkEmailReadRounded from "@mui/icons-material/MarkEmailReadRounded";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";

import AuthLayout, { FieldLabel } from "../../components/ui/AuthLayout";
import { forgotPassword, resetPassword } from "../../api/authApi";
import { tokens } from "../../theme/theme";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1 = request OTP, 2 = set new password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function requestOtp() {
    if (!email.trim()) { setFeedback({ type: "error", text: "Enter your email address." }); return; }
    setLoading(true); setFeedback({ type: "", text: "" });
    try {
      const { ok, message } = await forgotPassword(email.trim());
      if (ok) {
        setFeedback({ type: "success", text: message || "If that email exists, a reset code is on its way." });
        setStep(2);
      } else {
        setFeedback({ type: "error", text: message || "Couldn't start the reset." });
      }
    } catch {
      setFeedback({ type: "error", text: "Couldn't reach the server. Try again." });
    } finally {
      setLoading(false);
    }
  }

  async function submitReset() {
    if (!otp.trim() || !newPassword) { setFeedback({ type: "error", text: "Enter the code and a new password." }); return; }
    if (newPassword.length < 6) { setFeedback({ type: "error", text: "Use at least 6 characters." }); return; }
    setLoading(true); setFeedback({ type: "", text: "" });
    try {
      const { ok, message } = await resetPassword(otp.trim(), newPassword);
      if (ok) {
        setFeedback({ type: "success", text: "Password updated. Redirecting to sign in…" });
        setTimeout(() => navigate("/login"), 1300);
      } else {
        setFeedback({ type: "error", text: message || "That code didn't work." });
      }
    } catch {
      setFeedback({ type: "error", text: "Couldn't reach the server. Try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title={step === 1 ? "Reset your password" : "Enter your code"}
      subtitle={step === 1 ? "We'll email you a one-time code" : `Sent to ${email}`}
    >
      {step === 1 ? (
        <Stack component="form" spacing={2.5} onSubmit={(e) => { e.preventDefault(); requestOtp(); }}>
          <Box>
            <FieldLabel>Email</FieldLabel>
            <TextField fullWidth size="small" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Box>
          {feedback.text && (
            <Alert severity={feedback.type === "success" ? "success" : "error"} sx={{ borderRadius: "12px", fontSize: "0.85rem", py: 0.5 }}>{feedback.text}</Alert>
          )}
          <Button type="submit" variant="contained" fullWidth disabled={loading} startIcon={!loading && <MarkEmailReadRounded />} sx={{ height: 48 }}>
            {loading ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : "Send reset code"}
          </Button>
        </Stack>
      ) : (
        <Stack component="form" spacing={2.25} onSubmit={(e) => { e.preventDefault(); submitReset(); }}>
          <Box>
            <FieldLabel>Reset code</FieldLabel>
            <TextField fullWidth size="small" placeholder="6-digit code" value={otp} onChange={(e) => setOtp(e.target.value)} slotProps={{ htmlInput: { style: { letterSpacing: "0.3em" } } }} />
          </Box>
          <Box>
            <FieldLabel>New password</FieldLabel>
            <TextField
              fullWidth size="small" type={showPw ? "text" : "password"} placeholder="At least 6 characters"
              value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              slotProps={{ input: { endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPw((p) => !p)} edge="end" sx={{ color: tokens.textFaint }}>
                    {showPw ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                  </IconButton>
                </InputAdornment>
              ) } }}
            />
          </Box>
          {feedback.text && (
            <Alert severity={feedback.type === "success" ? "success" : "error"} sx={{ borderRadius: "12px", fontSize: "0.85rem", py: 0.5 }}>{feedback.text}</Alert>
          )}
          <Button type="submit" variant="contained" fullWidth disabled={loading} sx={{ height: 48 }}>
            {loading ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : "Update password"}
          </Button>
          <Button type="button" variant="text" onClick={() => { setStep(1); setFeedback({ type: "", text: "" }); }} startIcon={<ArrowBackRounded />} sx={{ alignSelf: "center" }}>
            Use a different email
          </Button>
        </Stack>
      )}

      <Typography sx={{ textAlign: "center", color: tokens.textFaint, fontSize: "0.88rem", mt: 2.5 }}>
        <Box component={Link} to="/login" sx={{ color: tokens.accent, fontWeight: 700, textDecoration: "none" }}>Back to sign in</Box>
      </Typography>
    </AuthLayout>
  );
}

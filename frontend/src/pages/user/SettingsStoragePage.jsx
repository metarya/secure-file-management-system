import { useEffect, useState } from "react";
import {
  Box, Typography, MenuItem, TextField, Button, Paper, Chip, Alert, Divider, CircularProgress,
} from "@mui/material";
import CloudDoneRounded from "@mui/icons-material/CloudDoneRounded";
import SaveRounded from "@mui/icons-material/SaveRounded";
import WifiTetheringRounded from "@mui/icons-material/WifiTetheringRounded";

import AppShell from "../../components/ui/AppShell";
import PageHeader from "../../components/ui/PageHeader";
import { useToast } from "../../components/ui/Toast";
import { tokens } from "../../theme/theme";
import { getStorageSettings, updateStorageSettings, testStorageConnection } from "../../api/storageApi";

const PROVIDER_LABELS = {
  LOCAL: "Local Storage",
  S3: "Amazon S3",
  GOOGLE_DRIVE: "Google Drive",
  ONEDRIVE: "Microsoft OneDrive",
  SFTP: "SFTP",
};

const EMPTY = {
  defaultProvider: "LOCAL",
  localDirectory: "",
  s3Bucket: "", s3Region: "", s3AccessKey: "", s3SecretKey: "",
  googleClientId: "", googleClientSecret: "", googleRefreshToken: "",
  oneDriveClientId: "", oneDriveClientSecret: "", oneDriveRefreshToken: "",
  sftpHost: "", sftpPort: "22", sftpUsername: "", sftpPassword: "", sftpRemoteDir: "",
};

export default function SettingsStoragePage() {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [meta, setMeta] = useState(null); // configured/connected flags from server
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    getStorageSettings()
      .then((s) => {
        setMeta(s);
        setForm((f) => ({
          ...f,
          defaultProvider: s.defaultProvider || "LOCAL",
          localDirectory: s.localDirectory || "",
          s3Bucket: s.s3Bucket || "",
          s3Region: s.s3Region || "",
          googleClientId: s.googleClientId || "",
          oneDriveClientId: s.oneDriveClientId || "",
          sftpHost: s.sftpHost || "",
          sftpPort: s.sftpPort || "22",
          sftpUsername: s.sftpUsername || "",
          sftpRemoteDir: s.sftpRemoteDir || "",
        }));
      })
      .catch((e) => toast(e.message || "Couldn't load storage settings.", "error"))
      .finally(() => setLoading(false));
  }, [toast]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const providers = meta?.supportedProviders || ["LOCAL", "S3", "GOOGLE_DRIVE", "ONEDRIVE"];

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const r = await testStorageConnection(form);
      setTestResult(r);
    } catch (e) {
      setTestResult({ success: false, message: e.message || "Connection test failed." });
    } finally {
      setTesting(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await updateStorageSettings(form);
      setMeta(updated);
      // Clear write-only secret fields after a successful save.
      setForm((f) => ({ ...f, s3AccessKey: "", s3SecretKey: "", googleClientSecret: "", googleRefreshToken: "", oneDriveClientSecret: "", oneDriveRefreshToken: "", sftpPassword: "" }));
      toast("Storage settings saved.", "success");
    } catch (e) {
      toast(e.message || "Couldn't save settings.", "error");
    } finally {
      setSaving(false);
    }
  }

  const secretPlaceholder = (configured) => (configured ? "•••••••• (leave blank to keep)" : "");

  return (
    <AppShell>
      <PageHeader eyebrow="Settings" title="Storage" subtitle="Choose where your uploaded files are stored. This affects only your future uploads." />

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>
      ) : (
        <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: "18px", maxWidth: 720 }}>
          <TextField
            select fullWidth label="Default storage provider" value={form.defaultProvider}
            onChange={set("defaultProvider")} sx={{ mb: 3 }}
            helperText="New uploads use this provider. Existing files stay where they were uploaded."
          >
            {providers.map((p) => <MenuItem key={p} value={p}>{PROVIDER_LABELS[p] || p}</MenuItem>)}
          </TextField>

          <Divider sx={{ mb: 2.5, borderColor: tokens.border }} />

          {form.defaultProvider === "LOCAL" && (
            <Box sx={{ display: "grid", gap: 2 }}>
              <Typography sx={{ fontWeight: 700, color: tokens.text }}>Local Storage</Typography>
              <TextField fullWidth label="Upload directory" value={form.localDirectory} onChange={set("localDirectory")}
                placeholder="uploads/user-storage" helperText="Server-side directory where your files are written." />
            </Box>
          )}

          {form.defaultProvider === "S3" && (
            <Box sx={{ display: "grid", gap: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography sx={{ fontWeight: 700, color: tokens.text }}>Amazon S3</Typography>
                {meta?.s3Configured && <Chip size="small" color="success" label="Configured" icon={<CloudDoneRounded />} />}
              </Box>
              <TextField fullWidth label="Bucket" value={form.s3Bucket} onChange={set("s3Bucket")} />
              <TextField fullWidth label="Region" value={form.s3Region} onChange={set("s3Region")} placeholder="us-east-1" />
              <TextField fullWidth label="Access Key" value={form.s3AccessKey} onChange={set("s3AccessKey")}
                placeholder={secretPlaceholder(meta?.s3Configured)} autoComplete="off" />
              <TextField fullWidth type="password" label="Secret Key" value={form.s3SecretKey} onChange={set("s3SecretKey")}
                placeholder={secretPlaceholder(meta?.s3Configured)} autoComplete="new-password" />
            </Box>
          )}

          {form.defaultProvider === "GOOGLE_DRIVE" && (
            <Box sx={{ display: "grid", gap: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography sx={{ fontWeight: 700, color: tokens.text }}>Google Drive</Typography>
                {meta?.googleConnected && <Chip size="small" color="success" label="Connected" icon={<CloudDoneRounded />} />}
              </Box>
              <TextField fullWidth label="OAuth Client ID" value={form.googleClientId} onChange={set("googleClientId")} />
              <TextField fullWidth type="password" label="OAuth Client Secret" value={form.googleClientSecret} onChange={set("googleClientSecret")}
                placeholder={secretPlaceholder(meta?.googleConnected)} autoComplete="new-password" />
              <TextField fullWidth type="password" label="OAuth Refresh Token" value={form.googleRefreshToken} onChange={set("googleRefreshToken")}
                placeholder={secretPlaceholder(meta?.googleConnected)} autoComplete="new-password"
                helperText="Obtained from the Google OAuth consent flow (offline access)." />
            </Box>
          )}

          {form.defaultProvider === "ONEDRIVE" && (
            <Box sx={{ display: "grid", gap: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography sx={{ fontWeight: 700, color: tokens.text }}>Microsoft OneDrive</Typography>
                {meta?.oneDriveConnected && <Chip size="small" color="success" label="Connected" icon={<CloudDoneRounded />} />}
              </Box>
              <TextField fullWidth label="OAuth Client ID" value={form.oneDriveClientId} onChange={set("oneDriveClientId")} />
              <TextField fullWidth type="password" label="OAuth Client Secret" value={form.oneDriveClientSecret} onChange={set("oneDriveClientSecret")}
                placeholder={secretPlaceholder(meta?.oneDriveConnected)} autoComplete="new-password" />
              <TextField fullWidth type="password" label="OAuth Refresh Token" value={form.oneDriveRefreshToken} onChange={set("oneDriveRefreshToken")}
                placeholder={secretPlaceholder(meta?.oneDriveConnected)} autoComplete="new-password"
                helperText="Obtained from the Microsoft identity OAuth flow (offline_access)." />
            </Box>
          )}

          {form.defaultProvider === "SFTP" && (
            <Box sx={{ display: "grid", gap: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography sx={{ fontWeight: 700, color: tokens.text }}>SFTP</Typography>
                {meta?.sftpConfigured && <Chip size="small" color="success" label="Configured" icon={<CloudDoneRounded />} />}
              </Box>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 2 }}>
                <TextField fullWidth label="Host" value={form.sftpHost} onChange={set("sftpHost")} placeholder="sftp.example.com" />
                <TextField label="Port" value={form.sftpPort} onChange={set("sftpPort")} sx={{ width: 100 }} placeholder="22" />
              </Box>
              <TextField fullWidth label="Username" value={form.sftpUsername} onChange={set("sftpUsername")} autoComplete="off" />
              <TextField fullWidth type="password" label="Password" value={form.sftpPassword} onChange={set("sftpPassword")}
                placeholder={secretPlaceholder(meta?.sftpConfigured)} autoComplete="new-password" />
              <TextField fullWidth label="Remote Directory" value={form.sftpRemoteDir} onChange={set("sftpRemoteDir")}
                placeholder="/uploads" helperText="Base directory on the SFTP server where files will be stored." />
            </Box>
          )}

          {testResult && (
            <Alert severity={testResult.success ? "success" : "error"} sx={{ mt: 2.5 }}>
              {testResult.success ? "✓ Connected" : "✗ Connection Failed"} — {testResult.message}
            </Alert>
          )}

          <Box sx={{ display: "flex", gap: 1.5, mt: 3, flexWrap: "wrap" }}>
            <Button variant="outlined" startIcon={<WifiTetheringRounded />} onClick={handleTest} disabled={testing}>
              {testing ? "Testing…" : "Test connection"}
            </Button>
            <Button variant="contained" startIcon={<SaveRounded />} onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save settings"}
            </Button>
          </Box>
        </Paper>
      )}
    </AppShell>
  );
}

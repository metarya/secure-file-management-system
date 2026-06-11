import { createContext, useCallback, useContext, useState } from "react";
import { Snackbar, Alert } from "@mui/material";

const ToastContext = createContext(() => {});

// Usage: const toast = useToast();  toast("Saved", "success")
export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [state, setState] = useState({ open: false, message: "", severity: "success" });

  const showToast = useCallback((message, severity = "success") => {
    setState({ open: true, message: String(message ?? ""), severity });
  }, []);

  const close = (_e, reason) => {
    if (reason === "clickaway") return;
    setState((s) => ({ ...s, open: false }));
  };

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <Snackbar
        open={state.open}
        autoHideDuration={3800}
        onClose={close}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={close}
          severity={state.severity}
          variant="filled"
          sx={{ borderRadius: "12px", fontWeight: 600, alignItems: "center" }}
        >
          {state.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}

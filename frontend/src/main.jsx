import React from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider, CssBaseline } from "@mui/material";

import theme from "./theme/theme";
import AppRoutes from "./routes/AppRoutes";
import { ToastProvider } from "./components/ui/Toast";

import "./styles/app.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </ThemeProvider>
  </React.StrictMode>
);

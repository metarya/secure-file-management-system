import React from "react";
import { createRoot } from "react-dom/client";

import {
  ThemeProvider,
  CssBaseline
} from "@mui/material";

import AppRoutes from "./routes/AppRoutes";

import theme from "./theme/theme";

import "./styles/app.css";
import "./styles/table.css";
import "./styles/modal.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppRoutes />
    </ThemeProvider>
  </React.StrictMode>
);
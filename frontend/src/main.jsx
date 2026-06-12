import React from "react";
import { createRoot } from "react-dom/client";

import AppRoutes from "./routes/AppRoutes";
import { ColorModeProvider } from "./theme/ColorModeContext";
import { ToastProvider } from "./components/ui/Toast";

import "./styles/app.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ColorModeProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </ColorModeProvider>
  </React.StrictMode>
);

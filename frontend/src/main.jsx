import React from "react";
import { createRoot } from "react-dom/client";

import AppRoutes from "./routes/AppRoutes";

import "./styles/app.css";
import "./styles/table.css";
import "./styles/modal.css";


createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppRoutes />
  </React.StrictMode>
);
import { BrowserRouter, Route, Routes } from "react-router-dom";

import DashboardPage from "../App";
import FilePage from "../pages/FilePage";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/files" element={<FilePage />} />
      </Routes>
    </BrowserRouter>
  );
}
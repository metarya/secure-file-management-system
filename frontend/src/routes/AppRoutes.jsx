import { BrowserRouter, Link, Route, Routes } from "react-router-dom";

import DashboardPage from "../App";
import FilePage from "../pages/FilePage";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <nav className="page-nav">
        <Link className="nav-link" to="/">
          Home
        </Link>

        <Link className="nav-link" to="/files">
          Files
        </Link>
      </nav>

      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/files" element={<FilePage />} />
      </Routes>
    </BrowserRouter>
  );
}
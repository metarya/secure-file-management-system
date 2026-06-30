import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Typography,
  Avatar, IconButton, AppBar, Toolbar, useMediaQuery, Menu, MenuItem, Divider,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import DashboardRounded from "@mui/icons-material/DashboardRounded";
import FolderRounded from "@mui/icons-material/FolderRounded";
import ShareRounded from "@mui/icons-material/ShareRounded";
import PeopleRounded from "@mui/icons-material/PeopleRounded";
import InsertDriveFileRounded from "@mui/icons-material/InsertDriveFileRounded";
import ReceiptLongRounded from "@mui/icons-material/ReceiptLongRounded";
import ShieldRounded from "@mui/icons-material/ShieldRounded";
import LogoutRounded from "@mui/icons-material/LogoutRounded";
import MenuRounded from "@mui/icons-material/MenuRounded";
import FolderOpenRounded from "@mui/icons-material/FolderOpenRounded";
import RestoreFromTrashRounded from "@mui/icons-material/RestoreFromTrashRounded";

import { tokens } from "../../theme/theme";
import ThemeToggle from "./ThemeToggle";
import { loadStoredUser, logout, isAdmin } from "../../utils/auth";
import { logoutServer } from "../../api/authApi";
import { avatarColor, initials } from "../../utils/format";

const WIDTH = 268;
// Auto-retract after this many ms of inactivity (hover away)
const RETRACT_DELAY = 4000;

const userNav = [
  { label: "My Files", to: "/dashboard", icon: <FolderRounded /> },
  { label: "Shared with me", to: "/shared", icon: <ShareRounded /> },
  { label: "Recycle Bin", to: "/recycle-bin", icon: <RestoreFromTrashRounded /> },
];

const adminNav = [
  { label: "My Files", to: "/dashboard", icon: <FolderRounded /> },
  { label: "Overview", to: "/admin/dashboard", icon: <DashboardRounded /> },
  { label: "Users", to: "/admin/users", icon: <PeopleRounded /> },
  { label: "Files", to: "/admin/files", icon: <InsertDriveFileRounded /> },
  { label: "Activity Logs", to: "/admin/activity", icon: <ReceiptLongRounded /> },
  { label: "Permissions", to: "/admin/permissions", icon: <ShieldRounded /> },
];

function Brand() {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, px: 2.5, py: 2.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box sx={{
          width: 40, height: 40, borderRadius: "12px", display: "grid", placeItems: "center",
          background: tokens.accentGradient, boxShadow: "0 8px 22px rgba(99,102,241,0.4)",
        }}>
          <FolderOpenRounded sx={{ color: "#fff", fontSize: 22 }} />
        </Box>
        <Box>
          <Typography sx={{ fontFamily: tokens.display, fontWeight: 700, fontSize: "1.15rem", color: tokens.text, lineHeight: 1 }}>
            FileVault
          </Typography>
          <Typography sx={{ color: tokens.textFaint, fontSize: "0.68rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Secure storage
          </Typography>
        </Box>
      </Box>
      <ThemeToggle />
    </Box>
  );
}

function NavList({ items, pathname, onNavigate }) {
  return (
    <List sx={{ px: 1.5, flex: 1 }}>
      {items.map((item) => {
        const active = pathname === item.to || pathname.startsWith(item.to + "/");
        return (
          <ListItemButton
            key={item.to}
            component={Link}
            to={item.to}
            onClick={onNavigate}
            sx={{
              borderRadius: "12px", mb: 0.5, px: 1.75, py: 1.1,
              // Use accent color text when active so it's visible in both light and dark
              color: active ? tokens.accent : tokens.textDim,
              background: active ? "rgba(99,102,241,0.12)" : "transparent",
              border: active ? `1px solid rgba(99,102,241,0.30)` : "1px solid transparent",
              "&:hover": {
                background: active ? "rgba(99,102,241,0.18)" : tokens.surfaceHover,
                color: tokens.text,
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 38, color: active ? tokens.accent : tokens.textFaint }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText
              slotProps={{ primary: { style: { fontSize: "0.92rem", fontWeight: active ? 700 : 500 } } }}
            >
              {item.label}
            </ListItemText>
          </ListItemButton>
        );
      })}
    </List>
  );
}

export default function AppShell({ children }) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchor, setAnchor] = useState(null);
  // Desktop sidebar: expanded by default, auto-retracts after inactivity
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const retractTimer = useRef(null);

  const user = loadStoredUser();
  const admin = isAdmin(user);
  const adminSection = pathname.startsWith("/admin");

  const nav = adminSection ? adminNav : [
    ...userNav,
    ...(admin ? [{ label: "Admin console", to: "/admin/dashboard", icon: <ShieldRounded /> }] : []),
  ];

  async function handleLogout() {
    // Record the sign-out (best-effort) before clearing the local session.
    await logoutServer();
    logout();
    navigate("/login", { replace: true });
  }

  // Auto-retract logic: when mouse leaves the sidebar, schedule a retract
  function handleSidebarMouseEnter() {
    clearTimeout(retractTimer.current);
    setSidebarExpanded(true);
  }
  function handleSidebarMouseLeave() {
    clearTimeout(retractTimer.current);
    retractTimer.current = setTimeout(() => {
      setSidebarExpanded(false);
    }, RETRACT_DELAY);
  }
  // Clear timer on unmount
  useEffect(() => () => clearTimeout(retractTimer.current), []);

  const accountColor = avatarColor(user?.email || "");
  const collapsedWidth = 72;
  const sidebarWidth = isDesktop ? (sidebarExpanded ? WIDTH : collapsedWidth) : WIDTH;

  const drawer = (
    <Box
      sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}
      onMouseEnter={isDesktop ? handleSidebarMouseEnter : undefined}
      onMouseLeave={isDesktop ? handleSidebarMouseLeave : undefined}
    >
      {/* Brand — hide text when collapsed */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: sidebarExpanded ? "space-between" : "center", gap: 1.5, px: sidebarExpanded ? 2.5 : 1, py: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{
            width: 40, height: 40, flexShrink: 0, borderRadius: "12px", display: "grid", placeItems: "center",
            background: tokens.accentGradient, boxShadow: "0 8px 22px rgba(99,102,241,0.4)",
          }}>
            <FolderOpenRounded sx={{ color: "#fff", fontSize: 22 }} />
          </Box>
          {sidebarExpanded && (
            <Box>
              <Typography sx={{ fontFamily: tokens.display, fontWeight: 700, fontSize: "1.15rem", color: tokens.text, lineHeight: 1 }}>
                FileVault
              </Typography>
              <Typography sx={{ color: tokens.textFaint, fontSize: "0.68rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Secure storage
              </Typography>
            </Box>
          )}
        </Box>
        {sidebarExpanded && <ThemeToggle />}
      </Box>

      <Divider sx={{ borderColor: tokens.border, mx: sidebarExpanded ? 2.5 : 1 }} />

      {adminSection && sidebarExpanded && (
        <Typography sx={{ px: 3, pt: 2, pb: 0.5, color: tokens.textFaint, fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Administration
        </Typography>
      )}

      {/* Nav items — collapse to icon-only */}
      <List sx={{ px: sidebarExpanded ? 1.5 : 0.75, flex: 1 }}>
        {nav.map((item) => {
          const active = pathname === item.to || pathname.startsWith(item.to + "/");
          return (
            <ListItemButton
              key={item.to}
              component={Link}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              title={!sidebarExpanded ? item.label : undefined}
              sx={{
                borderRadius: "12px", mb: 0.5,
                px: sidebarExpanded ? 1.75 : 1.5,
                py: 1.1,
                justifyContent: sidebarExpanded ? "flex-start" : "center",
                color: active ? tokens.accent : tokens.textDim,
                background: active ? "rgba(99,102,241,0.12)" : "transparent",
                border: active ? "1px solid rgba(99,102,241,0.30)" : "1px solid transparent",
                "&:hover": {
                  background: active ? "rgba(99,102,241,0.18)" : tokens.surfaceHover,
                  color: tokens.text,
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: sidebarExpanded ? 38 : 0, color: active ? tokens.accent : tokens.textFaint, justifyContent: "center" }}>
                {item.icon}
              </ListItemIcon>
              {sidebarExpanded && (
                <ListItemText
                  slotProps={{ primary: { style: { fontSize: "0.92rem", fontWeight: active ? 700 : 500 } } }}
                >
                  {item.label}
                </ListItemText>
              )}
            </ListItemButton>
          );
        })}
      </List>

      {/* Account section */}
      <Box sx={{ p: sidebarExpanded ? 1.5 : 0.75 }}>
        <Box
          onClick={(e) => setAnchor(e.currentTarget)}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: sidebarExpanded ? 1.25 : 0,
            p: sidebarExpanded ? 1.25 : 1,
            borderRadius: "14px",
            cursor: "pointer",
            justifyContent: sidebarExpanded ? "flex-start" : "center",
            border: `1px solid ${tokens.border}`,
            background: tokens.surface,
            "&:hover": { borderColor: tokens.borderStrong },
          }}
        >
          <Avatar sx={{ width: 38, height: 38, bgcolor: accountColor, fontSize: "0.85rem", fontWeight: 700, flexShrink: 0 }}>
            {initials(user?.fullName, user?.email)}
          </Avatar>
          {sidebarExpanded && (
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography noWrap sx={{ color: tokens.text, fontWeight: 600, fontSize: "0.85rem" }}>
                {user?.fullName || "Account"}
              </Typography>
              <Typography noWrap sx={{ color: tokens.textFaint, fontSize: "0.72rem" }}>
                {user?.email}
              </Typography>
            </Box>
          )}
        </Box>
        <Menu
          anchorEl={anchor}
          open={Boolean(anchor)}
          onClose={() => setAnchor(null)}
          transformOrigin={{ horizontal: "left", vertical: "bottom" }}
          anchorOrigin={{ horizontal: "left", vertical: "top" }}
          slotProps={{ paper: { sx: { width: WIDTH - 36, mt: -1 } } }}
        >
          {admin && (
            <MenuItem component={Link} to={adminSection ? "/dashboard" : "/admin/dashboard"} onClick={() => setAnchor(null)} sx={{ gap: 1.25, fontSize: "0.88rem" }}>
              {adminSection ? <FolderRounded fontSize="small" /> : <ShieldRounded fontSize="small" />}
              {adminSection ? "My files" : "Admin console"}
            </MenuItem>
          )}
          <MenuItem onClick={handleLogout} sx={{ gap: 1.25, fontSize: "0.88rem", color: tokens.danger }}>
            <LogoutRounded fontSize="small" /> Sign out
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ minHeight: "100dvh", background: tokens.bgGradient, backgroundAttachment: "fixed" }}>
      {/* Mobile top bar */}
      {!isDesktop && (
        <AppBar position="sticky" elevation={0} sx={{ background: tokens.topbar, backdropFilter: "blur(16px)", borderBottom: `1px solid ${tokens.border}` }}>
          <Toolbar sx={{ minHeight: 60 }}>
            <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ color: tokens.text, mr: 1 }}>
              <MenuRounded />
            </IconButton>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{ width: 30, height: 30, borderRadius: "9px", display: "grid", placeItems: "center", background: tokens.accentGradient }}>
                <FolderOpenRounded sx={{ color: "#fff", fontSize: 17 }} />
              </Box>
              <Typography sx={{ fontFamily: tokens.display, fontWeight: 700, color: tokens.text }}>FileVault</Typography>
            </Box>
            <Box sx={{ flex: 1 }} />
            <ThemeToggle />
          </Toolbar>
        </AppBar>
      )}

      {/* Sidebar */}
      {isDesktop ? (
        <Drawer
          variant="permanent"
          sx={{
            width: sidebarWidth,
            flexShrink: 0,
            transition: "width 0.25s cubic-bezier(0.4,0,0.2,1)",
            "& .MuiDrawer-paper": {
              width: sidebarWidth,
              transition: "width 0.25s cubic-bezier(0.4,0,0.2,1)",
              boxSizing: "border-box",
              border: "none",
              borderRight: `1px solid ${tokens.border}`,
              background: tokens.sidebar,
              backdropFilter: "blur(20px)",
              overflowX: "hidden",
            },
          }}
        >
          {drawer}
        </Drawer>
      ) : (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ "& .MuiDrawer-paper": { width: WIDTH, border: "none", background: tokens.sidebar, backdropFilter: "blur(20px)" } }}
        >
          {drawer}
        </Drawer>
      )}

      {/* Content */}
      <Box
        component="main"
        sx={{
          ml: isDesktop ? `${sidebarWidth}px` : 0,
          transition: "margin-left 0.25s cubic-bezier(0.4,0,0.2,1)",
          px: { xs: 2, sm: 3, md: 5 },
          py: { xs: 3, md: 4.5 },
          maxWidth: 1320,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

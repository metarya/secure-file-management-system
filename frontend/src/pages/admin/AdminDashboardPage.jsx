import { useEffect, useState } from "react";

import {
  Box,
  Typography,
  Grid,
  Paper,
  CircularProgress,
} from "@mui/material";

import { getAdminStats } from "../../services/adminService";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const data =
          await getAdminStats();

        setStats(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          mt: 8,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography
        variant="h4"
        fontWeight={700}
        mb={4}
      >
        Admin Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
            }}
          >
            <Typography
              variant="h6"
              color="text.secondary"
            >
              Total Users
            </Typography>

            <Typography
              variant="h3"
              fontWeight={700}
            >
              {stats?.totalUsers ?? 0}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
            }}
          >
            <Typography
              variant="h6"
              color="text.secondary"
            >
              Admin Users
            </Typography>

            <Typography
              variant="h3"
              fontWeight={700}
            >
              {stats?.totalAdmins ?? 0}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
            }}
          >
            <Typography
              variant="h6"
              color="text.secondary"
            >
              Regular Users
            </Typography>

            <Typography
              variant="h3"
              fontWeight={700}
            >
              {stats?.totalRegularUsers ?? 0}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
import React from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  AppBar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Container,
  Grid,
  Toolbar,
  Typography,
} from "@mui/material";
import { useAuth } from "../../context/AuthContext";

const CMS_MODULES = [
  {
    title: "Brand & Contact Settings",
    description:
      "Update salon name, logo, colors, phone, WhatsApp, and address.",
    status: "Active",
    active: true,
    path: "/admin/settings",
    actionLabel: "Manage Settings",
  },
  {
    title: "Service Catalogue",
    description:
      "Manage salon services, categories, inclusions, and INR prices.",
    status: "Active",
    active: true,
    path: "/admin/services",
    actionLabel: "Manage Services",
  },
  {
    title: "Packages",
    description:
      "Create and publish multi-service beauty packages with standalone pricing.",
    status: "Ticket 4",
    active: false,
  },
  {
    title: "Bundles",
    description: "Combine existing packages into promotional bundles.",
    status: "Ticket 5",
    active: false,
  },
  {
    title: "Festival Poster Studio",
    description:
      "Create festival campaign posters with immutable content snapshots and PNG export.",
    status: "Tickets 7–8",
    active: false,
  },
];

export default function AdminDashboardPage() {
  const { profile, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login", { replace: true });
  };

  const displayName =
    profile?.display_name || profile?.email || user?.email || "Administrator";

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar
        position="static"
        color="default"
        elevation={1}
        sx={{ bgcolor: "background.paper" }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ gap: 2, flexWrap: "wrap", py: 1 }}>
            <Typography
              variant="h6"
              component="div"
              sx={{
                flexGrow: 1,
                fontFamily: "'Playfair Display', serif",
                fontWeight: 700,
              }}
            >
              Aspen Glow CMS
            </Typography>
            <Chip
              label={`Admin: ${displayName}`}
              color="primary"
              variant="outlined"
              size="small"
            />
            <Button
              component={RouterLink}
              to="/"
              variant="text"
              size="small"
              color="inherit"
            >
              Public Site
            </Button>
            <Button
              component={RouterLink}
              to="/admin/reset-password"
              variant="outlined"
              size="small"
            >
              Change Password
            </Button>
            <Button
              type="button"
              variant="contained"
              color="primary"
              size="small"
              onClick={handleLogout}
            >
              Sign Out
            </Button>
          </Toolbar>
        </Container>
      </AppBar>

      <Container component="main" maxWidth="lg" sx={{ py: 6 }}>
        <Box mb={4}>
          <Typography variant="h3" component="h1" gutterBottom>
            Owner Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome back, {displayName}. Manage your salon catalogue, branding,
            contact details, and festival posters from one secure workspace.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {CMS_MODULES.map((mod) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={mod.title}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  borderTop: "4px solid",
                  borderColor: mod.active ? "primary.main" : "primary.light",
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={1.5}
                  >
                    <Typography variant="h6" component="h2" fontWeight="bold">
                      {mod.title}
                    </Typography>
                    <Chip
                      label={mod.status}
                      size="small"
                      color={mod.active ? "success" : "default"}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {mod.description}
                  </Typography>
                </CardContent>
                {mod.active && mod.path && (
                  <CardActions sx={{ px: 2, pb: 2 }}>
                    <Button
                      component={RouterLink}
                      to={mod.path}
                      variant="contained"
                      size="small"
                    >
                      {mod.actionLabel}
                    </Button>
                  </CardActions>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

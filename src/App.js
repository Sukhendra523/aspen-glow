import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./constants/theme";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/admin/ProtectedRoute";
import PublicHomePage from "./pages/PublicHomePage";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminResetPasswordPage from "./pages/admin/AdminResetPasswordPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";
import AdminServicesPage from "./pages/admin/AdminServicesPage";
import AdminPackagesPage from "./pages/admin/AdminPackagesPage";
import AdminBundlesPage from "./pages/admin/AdminBundlesPage";
import AdminMediaPage from "./pages/admin/AdminMediaPage";
import AdminPosterStudioPage from "./pages/admin/AdminPosterStudioPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicHomePage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin/reset-password" element={<AdminResetPasswordPage />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute>
            <AdminSettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/services"
        element={
          <ProtectedRoute>
            <AdminServicesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/packages"
        element={
          <ProtectedRoute>
            <AdminPackagesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/bundles"
        element={
          <ProtectedRoute>
            <AdminBundlesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/media"
        element={
          <ProtectedRoute>
            <AdminMediaPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/posters"
        element={
          <ProtectedRoute>
            <AdminPosterStudioPage />
          </ProtectedRoute>
        }
      />
      <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Main App Component
export default function App() {
  return (
    <ThemeProvider theme={theme}>
      {/* CssBaseline kickstarts an elegant, consistent, and simple baseline to build upon. */}
      <CssBaseline />
      {/* Google Fonts Import */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&family=Playfair+Display:wght@400;700&display=swap');
          html { scroll-behavior: smooth; }
        `}
      </style>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

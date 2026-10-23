import React, { useState } from "react";
import { Navigate, Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Link,
  TextField,
  Typography,
} from "@mui/material";
import { useAuth } from "../../context/AuthContext";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AdminLoginPage() {
  const { configured, isAdmin, loading, login, sendPasswordReset } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState("login"); // "login" | "recovery"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [recoverySent, setRecoverySent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const validateLogin = () => {
    const errors = {};
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      errors.email = "Email is required.";
    } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
      errors.email = "Enter a valid email address.";
    }
    if (!password) {
      errors.password = "Password is required.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateRecovery = () => {
    const errors = {};
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      errors.email = "Email is required.";
    } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
      errors.email = "Enter a valid email address.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!validateLogin()) {
      return;
    }

    setSubmitting(true);
    const result = await login({ email, password });
    setSubmitting(false);

    if (result.error) {
      setFormError(result.error);
      return;
    }

    if (result.isAdmin) {
      navigate("/admin", { replace: true });
    }
  };

  const handleRecoverySubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    setRecoverySent(false);

    if (!validateRecovery()) {
      return;
    }

    setSubmitting(true);
    const result = await sendPasswordReset(email);
    setSubmitting(false);

    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    setRecoverySent(true);
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setFieldErrors({});
    setFormError("");
    setRecoverySent(false);
  };

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        py: 6,
        bgcolor: "background.default",
      }}
    >
      <Container maxWidth="xs">
        <Card
          sx={{
            borderTop: "4px solid",
            borderColor: "primary.main",
            boxShadow: 3,
          }}
        >
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Typography
              variant="h4"
              component="h1"
              textAlign="center"
              gutterBottom
            >
              Aspen Glow CMS
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
              mb={3}
            >
              {mode === "login"
                ? "Sign in with your administrator account"
                : "Request a password reset link"}
            </Typography>

            {!configured && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                Supabase is not configured. Copy <code>.env.example</code> to{" "}
                <code>.env.local</code> and provide{" "}
                <code>REACT_APP_SUPABASE_URL</code> and{" "}
                <code>REACT_APP_SUPABASE_PUBLISHABLE_KEY</code>.
              </Alert>
            )}

            {formError && (
              <Alert severity="error" role="alert" sx={{ mb: 3 }}>
                {formError}
              </Alert>
            )}

            {recoverySent && (
              <Alert severity="success" role="status" sx={{ mb: 3 }}>
                If an administrator account exists for this email, a password
                reset link has been sent.
              </Alert>
            )}

            {mode === "login" ? (
              <Box component="form" noValidate onSubmit={handleLoginSubmit}>
                <TextField
                  id="admin-email"
                  name="email"
                  label="Email Address"
                  type="email"
                  fullWidth
                  required
                  margin="normal"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={Boolean(fieldErrors.email)}
                  helperText={fieldErrors.email}
                  disabled={submitting}
                />
                <TextField
                  id="admin-password"
                  name="password"
                  label="Password"
                  type="password"
                  fullWidth
                  required
                  margin="normal"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={Boolean(fieldErrors.password)}
                  helperText={fieldErrors.password}
                  disabled={submitting}
                />

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                  disabled={submitting}
                  sx={{ mt: 3, mb: 2 }}
                >
                  {submitting ? "Signing in..." : "Sign In"}
                </Button>

                <Box textAlign="center" mt={1}>
                  <Button
                    type="button"
                    variant="text"
                    size="small"
                    onClick={() => switchMode("recovery")}
                  >
                    Forgot password?
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box component="form" noValidate onSubmit={handleRecoverySubmit}>
                <TextField
                  id="recovery-email"
                  name="email"
                  label="Email Address"
                  type="email"
                  fullWidth
                  required
                  margin="normal"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={Boolean(fieldErrors.email)}
                  helperText={fieldErrors.email}
                  disabled={submitting}
                />

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                  disabled={submitting}
                  sx={{ mt: 3, mb: 2 }}
                >
                  {submitting ? "Sending Reset Link..." : "Send Reset Link"}
                </Button>

                <Box textAlign="center" mt={1}>
                  <Button
                    type="button"
                    variant="text"
                    size="small"
                    onClick={() => switchMode("login")}
                  >
                    Back to Sign In
                  </Button>
                </Box>
              </Box>
            )}

            <Box textAlign="center" mt={3}>
              <Link component={RouterLink} to="/" underline="hover">
                &larr; Return to Public Website
              </Link>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}


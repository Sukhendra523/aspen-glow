import React, { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Link,
  TextField,
  Typography,
} from "@mui/material";
import { useAuth } from "../../context/AuthContext";

export default function AdminResetPasswordPage() {
  const { user, isAdmin, recoveryMode, loading, changePassword } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canReset = Boolean(user || recoveryMode);

  if (loading) {
    return (
      <Box
        role="status"
        aria-live="polite"
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
      >
        <CircularProgress color="primary" aria-label="Verifying session" />
        <Typography variant="body1" color="text.secondary">
          Verifying session...
        </Typography>
      </Box>
    );
  }

  const validateForm = () => {
    const errors = {};
    if (!newPassword) {
      errors.newPassword = "New password is required.";
    } else if (newPassword.length < 8) {
      errors.newPassword = "Password must be at least 8 characters long.";
    }
    if (!confirmPassword) {
      errors.confirmPassword = "Confirm your new password.";
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    setSuccessMessage("");

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    const result = await changePassword(newPassword);
    setSubmitting(false);

    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    setNewPassword("");
    setConfirmPassword("");
    setSuccessMessage("Your password has been updated.");
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
              Update Password
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
              mb={3}
            >
              Choose a strong password of at least 8 characters.
            </Typography>

            {!loading && !canReset ? (
              <Alert severity="info" sx={{ mb: 3 }}>
                To reset your password, open the recovery link sent to your
                email or sign in first.
              </Alert>
            ) : (
              <>
                {formError && (
                  <Alert severity="error" role="alert" sx={{ mb: 3 }}>
                    {formError}
                  </Alert>
                )}

                {successMessage && (
                  <Alert severity="success" role="status" sx={{ mb: 3 }}>
                    {successMessage}
                  </Alert>
                )}

                <Box component="form" noValidate onSubmit={handleSubmit}>
                  <TextField
                    id="new-password"
                    name="newPassword"
                    label="New Password"
                    type="password"
                    fullWidth
                    required
                    margin="normal"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    error={Boolean(fieldErrors.newPassword)}
                    helperText={fieldErrors.newPassword}
                    disabled={submitting}
                  />
                  <TextField
                    id="confirm-password"
                    name="confirmPassword"
                    label="Confirm New Password"
                    type="password"
                    fullWidth
                    required
                    margin="normal"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    error={Boolean(fieldErrors.confirmPassword)}
                    helperText={fieldErrors.confirmPassword}
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
                    {submitting ? "Updating..." : "Update Password"}
                  </Button>
                </Box>
              </>
            )}

            <Box textAlign="center" mt={2}>
              <Link
                component={RouterLink}
                to={isAdmin ? "/admin" : "/admin/login"}
                underline="hover"
              >
                {isAdmin ? "Return to Dashboard" : "Return to Sign In"}
              </Link>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}


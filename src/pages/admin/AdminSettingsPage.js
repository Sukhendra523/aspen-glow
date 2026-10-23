import React, { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Grid,
  MenuItem,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import {
  APPROVED_BODY_FONTS,
  APPROVED_HEADING_FONTS,
  DEFAULT_BRAND_SETTINGS,
  DEFAULT_CONTACT_SETTINGS,
} from "../../constants/defaultSettings";
import {
  fetchAdminSiteSettings,
  saveBrandSettings,
  saveContactSettings,
} from "../../services/settingsService";
import { useAuth } from "../../context/AuthContext";

function hasDiff(current, baseline, keys) {
  return keys.some((key) => (current[key] || "") !== (baseline[key] || ""));
}

const BRAND_KEYS = [
  "brand_name",
  "short_name",
  "tagline",
  "hero_description",
  "logo_url",
  "primary_color",
  "secondary_color",
  "background_color",
  "heading_font",
  "body_font",
  "status",
];

const CONTACT_KEYS = [
  "contact_name",
  "phone",
  "whatsapp",
  "address",
  "booking_url",
  "appointment_note",
  "status",
];

export default function AdminSettingsPage() {
  const { client } = useAuth();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [savedBrand, setSavedBrand] = useState(DEFAULT_BRAND_SETTINGS);
  const [brandForm, setBrandForm] = useState(DEFAULT_BRAND_SETTINGS);
  const [brandFieldErrors, setBrandFieldErrors] = useState({});
  const [brandError, setBrandError] = useState("");
  const [brandSuccess, setBrandSuccess] = useState("");
  const [savingBrand, setSavingBrand] = useState(false);

  const [savedContact, setSavedContact] = useState(DEFAULT_CONTACT_SETTINGS);
  const [contactForm, setContactForm] = useState(DEFAULT_CONTACT_SETTINGS);
  const [contactFieldErrors, setContactFieldErrors] = useState({});
  const [contactError, setContactError] = useState("");
  const [contactSuccess, setContactSuccess] = useState("");
  const [savingContact, setSavingContact] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchAdminSiteSettings(client).then((result) => {
      if (!isMounted) return;
      setSavedBrand(result.brand);
      setBrandForm(result.brand);
      setSavedContact(result.contact);
      setContactForm(result.contact);
      setLoadError(result.error || "");
      setLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, [client]);

  const brandDirty = hasDiff(brandForm, savedBrand, BRAND_KEYS);
  const contactDirty = hasDiff(contactForm, savedContact, CONTACT_KEYS);

  const handleBrandChange = (field) => (event) => {
    const value = event.target.value;
    setBrandForm((prev) => ({ ...prev, [field]: value }));
    setBrandSuccess("");
  };

  const handleContactChange = (field) => (event) => {
    const value = event.target.value;
    setContactForm((prev) => ({ ...prev, [field]: value }));
    setContactSuccess("");
  };

  const handleBrandSubmit = async (event) => {
    event.preventDefault();
    setBrandError("");
    setBrandSuccess("");
    setBrandFieldErrors({});

    setSavingBrand(true);
    const result = await saveBrandSettings(brandForm, client);
    setSavingBrand(false);

    if (result.error) {
      setBrandFieldErrors(result.fieldErrors || {});
      setBrandError(result.error);
      return;
    }

    setSavedBrand(result.data);
    setBrandForm(result.data);
    setBrandSuccess("Brand settings saved.");
  };

  const handleContactSubmit = async (event) => {
    event.preventDefault();
    setContactError("");
    setContactSuccess("");
    setContactFieldErrors({});

    setSavingContact(true);
    const result = await saveContactSettings(contactForm, client);
    setSavingContact(false);

    if (result.error) {
      setContactFieldErrors(result.fieldErrors || {});
      setContactError(result.error);
      return;
    }

    setSavedContact(result.data);
    setContactForm(result.data);
    setContactSuccess("Contact settings saved.");
  };

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
        <CircularProgress color="primary" aria-label="Loading site settings" />
        <Typography variant="body1" color="text.secondary">
          Loading brand and contact settings...
        </Typography>
      </Box>
    );
  }

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
              Brand &amp; Contact Settings
            </Typography>
            {(brandDirty || contactDirty) && (
              <Chip
                label="Unsaved changes"
                color="warning"
                size="small"
                variant="outlined"
              />
            )}
            <Button
              component={RouterLink}
              to="/admin"
              variant="outlined"
              size="small"
            >
              &larr; Back to Dashboard
            </Button>
            <Button
              component={RouterLink}
              to="/"
              variant="text"
              size="small"
              color="inherit"
            >
              Public Site
            </Button>
          </Toolbar>
        </Container>
      </AppBar>

      <Container component="main" maxWidth="lg" sx={{ py: 5 }}>
        {loadError && (
          <Alert severity="warning" role="alert" sx={{ mb: 3 }}>
            {loadError}
          </Alert>
        )}

        <Grid container spacing={4}>
          {/* Brand Settings Form */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card
              sx={{
                borderTop: "4px solid",
                borderColor: "primary.main",
                height: "100%",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={2}
                >
                  <Typography variant="h5" component="h1" fontWeight="bold">
                    Brand Identity
                  </Typography>
                  <Chip
                    label={
                      brandForm.status === "published" ? "Published" : "Draft"
                    }
                    color={
                      brandForm.status === "published" ? "success" : "default"
                    }
                    size="small"
                  />
                </Box>

                {brandError && (
                  <Alert severity="error" role="alert" sx={{ mb: 2 }}>
                    {brandError}
                  </Alert>
                )}

                {brandSuccess && (
                  <Alert severity="success" role="status" sx={{ mb: 2 }}>
                    {brandSuccess}
                  </Alert>
                )}

                <Box component="form" noValidate onSubmit={handleBrandSubmit}>
                  <TextField
                    id="brand-name"
                    label="Full Brand Name"
                    fullWidth
                    required
                    margin="normal"
                    value={brandForm.brand_name}
                    onChange={handleBrandChange("brand_name")}
                    error={Boolean(brandFieldErrors.brand_name)}
                    helperText={brandFieldErrors.brand_name}
                    disabled={savingBrand}
                  />
                  <TextField
                    id="short-name"
                    label="Short Navigation Name"
                    fullWidth
                    required
                    margin="normal"
                    value={brandForm.short_name}
                    onChange={handleBrandChange("short_name")}
                    error={Boolean(brandFieldErrors.short_name)}
                    helperText={brandFieldErrors.short_name}
                    disabled={savingBrand}
                  />
                  <TextField
                    id="brand-tagline"
                    label="Hero Tagline"
                    fullWidth
                    margin="normal"
                    value={brandForm.tagline}
                    onChange={handleBrandChange("tagline")}
                    error={Boolean(brandFieldErrors.tagline)}
                    helperText={brandFieldErrors.tagline}
                    disabled={savingBrand}
                  />
                  <TextField
                    id="hero-description"
                    label="Hero Description"
                    fullWidth
                    multiline
                    minRows={2}
                    margin="normal"
                    value={brandForm.hero_description}
                    onChange={handleBrandChange("hero_description")}
                    error={Boolean(brandFieldErrors.hero_description)}
                    helperText={brandFieldErrors.hero_description}
                    disabled={savingBrand}
                  />
                  <TextField
                    id="logo-url"
                    label="Custom Logo URL (optional)"
                    fullWidth
                    margin="normal"
                    placeholder="https://..."
                    value={brandForm.logo_url}
                    onChange={handleBrandChange("logo_url")}
                    error={Boolean(brandFieldErrors.logo_url)}
                    helperText={
                      brandFieldErrors.logo_url ||
                      "Leave blank to use the default Aspen Glow logo."
                    }
                    disabled={savingBrand}
                  />

                  <Grid container spacing={2} sx={{ mt: 0.5 }}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        id="primary-color"
                        label="Primary Color (Hex)"
                        fullWidth
                        required
                        value={brandForm.primary_color}
                        onChange={handleBrandChange("primary_color")}
                        error={Boolean(brandFieldErrors.primary_color)}
                        helperText={brandFieldErrors.primary_color}
                        disabled={savingBrand}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        id="secondary-color"
                        label="Secondary Color (Hex)"
                        fullWidth
                        required
                        value={brandForm.secondary_color}
                        onChange={handleBrandChange("secondary_color")}
                        error={Boolean(brandFieldErrors.secondary_color)}
                        helperText={brandFieldErrors.secondary_color}
                        disabled={savingBrand}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        id="background-color"
                        label="Background Color (Hex)"
                        fullWidth
                        required
                        value={brandForm.background_color}
                        onChange={handleBrandChange("background_color")}
                        error={Boolean(brandFieldErrors.background_color)}
                        helperText={brandFieldErrors.background_color}
                        disabled={savingBrand}
                      />
                    </Grid>
                  </Grid>

                  <Grid container spacing={2} sx={{ mt: 0.5 }}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        id="heading-font"
                        select
                        label="Heading Font"
                        fullWidth
                        value={brandForm.heading_font}
                        onChange={handleBrandChange("heading_font")}
                        error={Boolean(brandFieldErrors.heading_font)}
                        helperText={brandFieldErrors.heading_font}
                        disabled={savingBrand}
                      >
                        {APPROVED_HEADING_FONTS.map((font) => (
                          <MenuItem key={font} value={font}>
                            {font}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        id="body-font"
                        select
                        label="Body Font"
                        fullWidth
                        value={brandForm.body_font}
                        onChange={handleBrandChange("body_font")}
                        error={Boolean(brandFieldErrors.body_font)}
                        helperText={brandFieldErrors.body_font}
                        disabled={savingBrand}
                      >
                        {APPROVED_BODY_FONTS.map((font) => (
                          <MenuItem key={font} value={font}>
                            {font}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                  </Grid>

                  <TextField
                    id="brand-status"
                    select
                    label="Publication Status"
                    fullWidth
                    margin="normal"
                    value={brandForm.status}
                    onChange={handleBrandChange("status")}
                    disabled={savingBrand}
                  >
                    <MenuItem value="published">
                      Published (visible on public site)
                    </MenuItem>
                    <MenuItem value="draft">
                      Draft (hidden from public site)
                    </MenuItem>
                  </TextField>

                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    disabled={savingBrand}
                    sx={{ mt: 3 }}
                  >
                    {savingBrand
                      ? "Saving Brand Settings..."
                      : "Save Brand Settings"}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Contact Settings Form */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card
              sx={{
                borderTop: "4px solid",
                borderColor: "primary.main",
                height: "100%",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={2}
                >
                  <Typography variant="h5" component="h2" fontWeight="bold">
                    Contact &amp; Booking Details
                  </Typography>
                  <Chip
                    label={
                      contactForm.status === "published" ? "Published" : "Draft"
                    }
                    color={
                      contactForm.status === "published" ? "success" : "default"
                    }
                    size="small"
                  />
                </Box>

                {contactError && (
                  <Alert severity="error" role="alert" sx={{ mb: 2 }}>
                    {contactError}
                  </Alert>
                )}

                {contactSuccess && (
                  <Alert severity="success" role="status" sx={{ mb: 2 }}>
                    {contactSuccess}
                  </Alert>
                )}

                <Box component="form" noValidate onSubmit={handleContactSubmit}>
                  <TextField
                    id="contact-name"
                    label="Contact Person Name"
                    fullWidth
                    required
                    margin="normal"
                    value={contactForm.contact_name}
                    onChange={handleContactChange("contact_name")}
                    error={Boolean(contactFieldErrors.contact_name)}
                    helperText={contactFieldErrors.contact_name}
                    disabled={savingContact}
                  />
                  <TextField
                    id="contact-phone"
                    label="Phone Number"
                    fullWidth
                    required
                    margin="normal"
                    value={contactForm.phone}
                    onChange={handleContactChange("phone")}
                    error={Boolean(contactFieldErrors.phone)}
                    helperText={contactFieldErrors.phone}
                    disabled={savingContact}
                  />
                  <TextField
                    id="contact-whatsapp"
                    label="WhatsApp Number (with country code)"
                    fullWidth
                    required
                    margin="normal"
                    placeholder="917011413546"
                    value={contactForm.whatsapp}
                    onChange={handleContactChange("whatsapp")}
                    error={Boolean(contactFieldErrors.whatsapp)}
                    helperText={contactFieldErrors.whatsapp}
                    disabled={savingContact}
                  />
                  <TextField
                    id="contact-address"
                    label="Salon Address"
                    fullWidth
                    required
                    multiline
                    minRows={2}
                    margin="normal"
                    value={contactForm.address}
                    onChange={handleContactChange("address")}
                    error={Boolean(contactFieldErrors.address)}
                    helperText={contactFieldErrors.address}
                    disabled={savingContact}
                  />
                  <TextField
                    id="appointment-note"
                    label="Appointment Note"
                    fullWidth
                    margin="normal"
                    value={contactForm.appointment_note}
                    onChange={handleContactChange("appointment_note")}
                    error={Boolean(contactFieldErrors.appointment_note)}
                    helperText={contactFieldErrors.appointment_note}
                    disabled={savingContact}
                  />
                  <TextField
                    id="booking-url"
                    label="Optional Booking URL"
                    fullWidth
                    margin="normal"
                    placeholder="https://..."
                    value={contactForm.booking_url}
                    onChange={handleContactChange("booking_url")}
                    error={Boolean(contactFieldErrors.booking_url)}
                    helperText={
                      contactFieldErrors.booking_url ||
                      "Optional external booking link (must begin with https:// or http://)."
                    }
                    disabled={savingContact}
                  />

                  <TextField
                    id="contact-status"
                    select
                    label="Publication Status"
                    fullWidth
                    margin="normal"
                    value={contactForm.status}
                    onChange={handleContactChange("status")}
                    disabled={savingContact}
                  >
                    <MenuItem value="published">
                      Published (visible on public site)
                    </MenuItem>
                    <MenuItem value="draft">
                      Draft (hidden from public site)
                    </MenuItem>
                  </TextField>

                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    disabled={savingContact}
                    sx={{ mt: 3 }}
                  >
                    {savingContact
                      ? "Saving Contact Settings..."
                      : "Save Contact Settings"}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Live Preview */}
          <Grid size={{ xs: 12 }}>
            <Card
              sx={{
                bgcolor: brandForm.background_color || "#FEFBF6",
                borderTop: "4px solid",
                borderColor: brandForm.primary_color || "primary.main",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography
                  variant="overline"
                  color="text.secondary"
                  display="block"
                  gutterBottom
                >
                  Live Brand &amp; Contact Preview
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontFamily: `'${brandForm.heading_font}', serif`,
                    color: brandForm.primary_color || "primary.main",
                    mb: 1,
                  }}
                >
                  {brandForm.brand_name} ({brandForm.short_name})
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontFamily: `'${brandForm.body_font}', sans-serif`,
                    mb: 2,
                  }}
                >
                  {brandForm.tagline}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Contact:</strong> {contactForm.contact_name} &bull;{" "}
                  <strong>Phone:</strong> {contactForm.phone} &bull;{" "}
                  <strong>WhatsApp:</strong> {contactForm.whatsapp} &bull;{" "}
                  <strong>Address:</strong> {contactForm.address}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}


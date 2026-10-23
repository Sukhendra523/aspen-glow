import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  FormGroup,
  Grid,
  MenuItem,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import {
  DEFAULT_BRAND_SETTINGS,
  DEFAULT_CONTACT_SETTINGS,
} from "../../constants/defaultSettings";
import { formatInrPrice } from "../../constants/serviceCatalogue";
import {
  DEFAULT_FESTIVALS,
  DEFAULT_POSTER_TEMPLATES,
  POSTER_FORMATS,
  POSTER_THEMES,
} from "../../poster/posterTemplates";
import { renderPosterToCanvas } from "../../poster/posterRenderer";
import {
  buildPosterSnapshot,
  validatePosterCampaignInput,
} from "../../poster/snapshotResolver";
import { fetchAdminSiteSettings } from "../../services/settingsService";
import { fetchAdminPackages } from "../../services/packageService";
import { fetchAdminBundles } from "../../services/bundleService";
import {
  createFestivalRecord,
  fetchAdminFestivals,
  fetchPosterTemplates,
} from "../../services/festivalService";
import { useAuth } from "../../context/AuthContext";

export default function AdminPosterStudioPage() {
  const { client } = useAuth();
  const canvasRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [brand, setBrand] = useState(DEFAULT_BRAND_SETTINGS);
  const [contact, setContact] = useState(DEFAULT_CONTACT_SETTINGS);
  const [festivals, setFestivals] = useState(DEFAULT_FESTIVALS);
  const [templates, setTemplates] = useState(DEFAULT_POSTER_TEMPLATES);
  const [packages, setPackages] = useState([]);
  const [bundles, setBundles] = useState([]);

  const [campaignName, setCampaignName] = useState(
    "Karwa Chauth Festive Campaign"
  );
  const [selectedFestivalId, setSelectedFestivalId] = useState(
    DEFAULT_FESTIVALS[0].id
  );
  const [selectedTemplateKey, setSelectedTemplateKey] = useState(
    DEFAULT_POSTER_TEMPLATES[0].template_key
  );
  const [formatKey, setFormatKey] = useState("square_1080");
  const [themeKey, setThemeKey] = useState("royal_rose");
  const [headline, setHeadline] = useState(
    DEFAULT_FESTIVALS[0].default_headline
  );
  const [subheadline, setSubheadline] = useState(
    DEFAULT_FESTIVALS[0].default_subheadline
  );
  const [validityNote, setValidityNote] = useState("");

  const [selectedPackageIds, setSelectedPackageIds] = useState([]);
  const [selectedBundleIds, setSelectedBundleIds] = useState([]);

  // Custom Festival Dialog state
  const [festivalDialogOpen, setFestivalDialogOpen] = useState(false);
  const [newFestivalForm, setNewFestivalForm] = useState({
    name: "",
    category: "Indian Festival",
    default_headline: "",
    default_subheadline: "",
    motif_label: "✨",
    accent_color: "#c2185b",
  });
  const [festivalFieldErrors, setFestivalFieldErrors] = useState({});
  const [festivalFormError, setFestivalFormError] = useState("");
  const [savingFestival, setSavingFestival] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    Promise.all([
      fetchAdminSiteSettings(client),
      fetchAdminFestivals(client),
      fetchPosterTemplates(client),
      fetchAdminPackages(client),
      fetchAdminBundles(client),
    ]).then(([settingsRes, festRes, tplRes, pkgRes, bndRes]) => {
      if (!isMounted) return;
      setBrand(settingsRes.brand);
      setContact(settingsRes.contact);

      const loadedFestivals =
        festRes.data && festRes.data.length > 0
          ? festRes.data
          : DEFAULT_FESTIVALS;
      setFestivals(loadedFestivals);
      setSelectedFestivalId(loadedFestivals[0].id);
      setHeadline(loadedFestivals[0].default_headline || "");
      setSubheadline(loadedFestivals[0].default_subheadline || "");

      const loadedTemplates =
        tplRes.data && tplRes.data.length > 0
          ? tplRes.data
          : DEFAULT_POSTER_TEMPLATES;
      setTemplates(loadedTemplates);
      setSelectedTemplateKey(loadedTemplates[0].template_key);

      const activePkgs = (pkgRes.data || []).filter(
        (p) => p.status !== "archived"
      );
      const activeBnds = (bndRes.data || []).filter(
        (b) => b.status !== "archived"
      );
      setPackages(activePkgs);
      setBundles(activeBnds);

      if (activePkgs.length > 0) {
        setSelectedPackageIds(activePkgs.slice(0, 2).map((p) => p.id));
      }

      setLoadError(pkgRes.error || bndRes.error || "");
      setLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, [client]);

  const activeFestival = useMemo(
    () =>
      festivals.find((f) => f.id === selectedFestivalId) ||
      festivals[0] ||
      DEFAULT_FESTIVALS[0],
    [festivals, selectedFestivalId]
  );

  const activeTemplate = useMemo(
    () =>
      templates.find((t) => t.template_key === selectedTemplateKey) ||
      templates[0] ||
      DEFAULT_POSTER_TEMPLATES[0],
    [templates, selectedTemplateKey]
  );

  const selectedPackages = useMemo(
    () => packages.filter((p) => selectedPackageIds.includes(p.id)),
    [packages, selectedPackageIds]
  );

  const selectedBundles = useMemo(
    () => bundles.filter((b) => selectedBundleIds.includes(b.id)),
    [bundles, selectedBundleIds]
  );

  const validation = useMemo(
    () =>
      validatePosterCampaignInput({
        campaignName,
        headline,
        subheadline,
        validityNote,
        formatKey,
        themeKey,
        template: activeTemplate,
        selectedPackages,
        selectedBundles,
      }),
    [
      campaignName,
      headline,
      subheadline,
      validityNote,
      formatKey,
      themeKey,
      activeTemplate,
      selectedPackages,
      selectedBundles,
    ]
  );

  const activeSnapshot = useMemo(
    () =>
      buildPosterSnapshot({
        campaignName,
        headline,
        subheadline,
        validityNote,
        festival: activeFestival,
        template: activeTemplate,
        formatKey,
        themeKey,
        brand,
        contact,
        selectedPackages,
        selectedBundles,
      }),
    [
      campaignName,
      headline,
      subheadline,
      validityNote,
      activeFestival,
      activeTemplate,
      formatKey,
      themeKey,
      brand,
      contact,
      selectedPackages,
      selectedBundles,
    ]
  );

  useEffect(() => {
    if (canvasRef.current && activeSnapshot) {
      renderPosterToCanvas(canvasRef.current, activeSnapshot);
    }
  }, [activeSnapshot]);

  const handleFestivalSelect = (event) => {
    const nextId = event.target.value;
    setSelectedFestivalId(nextId);
    const fest = festivals.find((f) => f.id === nextId);
    if (fest) {
      setHeadline(fest.default_headline || "");
      setSubheadline(fest.default_subheadline || "");
      setCampaignName(`${fest.name} Festive Campaign`);
    }
  };

  const handleTogglePackage = (pkgId) => {
    setSelectedPackageIds((prev) =>
      prev.includes(pkgId)
        ? prev.filter((id) => id !== pkgId)
        : [...prev, pkgId]
    );
  };

  const handleToggleBundle = (bundleId) => {
    setSelectedBundleIds((prev) =>
      prev.includes(bundleId)
        ? prev.filter((id) => id !== bundleId)
        : [...prev, bundleId]
    );
  };

  const handleCreateFestival = async (event) => {
    event.preventDefault();
    setFestivalFormError("");
    setFestivalFieldErrors({});

    setSavingFestival(true);
    const result = await createFestivalRecord(newFestivalForm, client);
    setSavingFestival(false);

    if (result.error) {
      setFestivalFieldErrors(result.fieldErrors || {});
      setFestivalFormError(result.error);
      return;
    }

    const created = result.data;
    setFestivals((prev) => [...prev, created]);
    setSelectedFestivalId(created.id);
    setHeadline(created.default_headline || "");
    setSubheadline(created.default_subheadline || "");
    setCampaignName(`${created.name} Festive Campaign`);
    setFestivalDialogOpen(false);
    setNewFestivalForm({
      name: "",
      category: "Indian Festival",
      default_headline: "",
      default_subheadline: "",
      motif_label: "✨",
      accent_color: "#c2185b",
    });
    setStatusMessage(`Added festival "${created.name}".`);
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
        <CircularProgress color="primary" aria-label="Loading Poster Studio" />
        <Typography variant="body1" color="text.secondary">
          Loading Festival Poster Studio...
        </Typography>
      </Box>
    );
  }

  const maxOfferings =
    Number(activeTemplate?.layout_config?.max_offerings) || 4;

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
              Festival Poster Studio
            </Typography>
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

      <Container component="main" maxWidth="lg" sx={{ py: 4 }}>
        {loadError && (
          <Alert severity="warning" role="alert" sx={{ mb: 3 }}>
            {loadError}
          </Alert>
        )}

        {statusMessage && (
          <Alert severity="success" role="status" sx={{ mb: 3 }}>
            {statusMessage}
          </Alert>
        )}

        <Grid container spacing={4}>
          {/* Left Column: Campaign, Festival, Template & Offerings Controls */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Card
              sx={{
                borderTop: "4px solid",
                borderColor: "primary.main",
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
                    Poster Configuration
                  </Typography>
                  <Button
                    type="button"
                    size="small"
                    variant="outlined"
                    onClick={() => setFestivalDialogOpen(true)}
                  >
                    + Add Festival
                  </Button>
                </Box>

                <TextField
                  id="poster-festival-select"
                  select
                  label="Select Festival / Occasion"
                  fullWidth
                  margin="normal"
                  value={selectedFestivalId}
                  onChange={handleFestivalSelect}
                >
                  {festivals.map((fest) => (
                    <MenuItem key={fest.id} value={fest.id}>
                      {fest.name} ({fest.category})
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  id="poster-template-select"
                  select
                  label="Poster Template"
                  fullWidth
                  margin="normal"
                  value={selectedTemplateKey}
                  onChange={(e) => setSelectedTemplateKey(e.target.value)}
                >
                  {templates.map((tpl) => (
                    <MenuItem key={tpl.template_key} value={tpl.template_key}>
                      {tpl.name} (up to{" "}
                      {tpl.layout_config?.max_offerings || 4} items)
                    </MenuItem>
                  ))}
                </TextField>

                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      id="poster-format-select"
                      select
                      label="Output Dimensions"
                      fullWidth
                      value={formatKey}
                      onChange={(e) => setFormatKey(e.target.value)}
                    >
                      {Object.values(POSTER_FORMATS).map((fmt) => (
                        <MenuItem key={fmt.key} value={fmt.key}>
                          {fmt.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      id="poster-theme-select"
                      select
                      label="Color Theme"
                      fullWidth
                      value={themeKey}
                      onChange={(e) => setThemeKey(e.target.value)}
                    >
                      {Object.values(POSTER_THEMES).map((thm) => (
                        <MenuItem key={thm.key} value={thm.key}>
                          {thm.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2.5 }} />

                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Campaign Copy
                </Typography>

                <TextField
                  id="poster-campaign-name"
                  label="Campaign Name"
                  fullWidth
                  required
                  margin="dense"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  error={Boolean(validation.errors.campaignName)}
                  helperText={validation.errors.campaignName}
                />

                <TextField
                  id="poster-headline"
                  label="Poster Headline"
                  fullWidth
                  required
                  margin="dense"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  error={Boolean(validation.errors.headline)}
                  helperText={validation.errors.headline}
                />

                <TextField
                  id="poster-subheadline"
                  label="Poster Subheadline"
                  fullWidth
                  margin="dense"
                  value={subheadline}
                  onChange={(e) => setSubheadline(e.target.value)}
                  error={Boolean(validation.errors.subheadline)}
                  helperText={validation.errors.subheadline}
                />

                <TextField
                  id="poster-validity-note"
                  label="Optional Validity / Offer Note"
                  fullWidth
                  margin="dense"
                  placeholder="Valid until Diwali Eve • Prior appointment required"
                  value={validityNote}
                  onChange={(e) => setValidityNote(e.target.value)}
                  error={Boolean(validation.errors.validityNote)}
                  helperText={
                    validation.errors.validityNote ||
                    "Leave blank if there is no specific date restriction."
                  }
                />

                <Divider sx={{ my: 2.5 }} />

                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1}
                >
                  <Typography variant="subtitle1" fontWeight="bold">
                    Featured Packages &amp; Bundles
                  </Typography>
                  <Chip
                    label={`Selected: ${
                      selectedPackages.length + selectedBundles.length
                    } / ${maxOfferings}`}
                    size="small"
                    color={validation.errors.offerings ? "error" : "primary"}
                  />
                </Box>

                {validation.errors.offerings && (
                  <Alert severity="error" role="alert" sx={{ mb: 2 }}>
                    {validation.errors.offerings}
                  </Alert>
                )}

                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  gutterBottom
                >
                  Packages
                </Typography>
                {packages.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    No active packages available.
                  </Typography>
                ) : (
                  <FormGroup sx={{ mb: 2 }}>
                    {packages.map((pkg) => (
                      <FormControlLabel
                        key={pkg.id}
                        control={
                          <Checkbox
                            checked={selectedPackageIds.includes(pkg.id)}
                            onChange={() => handleTogglePackage(pkg.id)}
                          />
                        }
                        label={`${pkg.name} (${formatInrPrice(pkg.price_inr)})`}
                      />
                    ))}
                  </FormGroup>
                )}

                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  gutterBottom
                >
                  Promotional Bundles
                </Typography>
                {bundles.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No active bundles available.
                  </Typography>
                ) : (
                  <FormGroup>
                    {bundles.map((bundle) => (
                      <FormControlLabel
                        key={bundle.id}
                        control={
                          <Checkbox
                            checked={selectedBundleIds.includes(bundle.id)}
                            onChange={() => handleToggleBundle(bundle.id)}
                          />
                        }
                        label={`${bundle.name} (${formatInrPrice(
                          bundle.price_inr
                        )})`}
                      />
                    ))}
                  </FormGroup>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column: Live Snapshot & Artwork Preview */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  flexWrap="wrap"
                  gap={1}
                  mb={2}
                >
                  <Typography variant="h5" component="h2" fontWeight="bold">
                    Live Poster Artwork Preview
                  </Typography>
                  <Box display="flex" gap={1}>
                    <Chip
                      label={`${activeSnapshot.template.name} (v${activeSnapshot.template.version})`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={`${activeSnapshot.template.width} × ${activeSnapshot.template.height} px`}
                      size="small"
                      color="primary"
                    />
                  </Box>
                </Box>

                {/* Accessible Snapshot Preview Card */}
                <Box
                  data-testid="poster-snapshot-preview"
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    bgcolor:
                      activeSnapshot.template.theme?.background || "#FEFBF6",
                    border: activeSnapshot.template.layout_config?.show_border
                      ? `4px solid ${
                          activeSnapshot.template.theme?.primary || "#d81b60"
                        }`
                      : "1px solid #e0e0e0",
                    textAlign: "center",
                    mb: 3,
                  }}
                >
                  <Chip
                    label={activeSnapshot.festival.motif_label}
                    size="small"
                    sx={{
                      mb: 1,
                      bgcolor: activeSnapshot.festival.accent_color,
                      color: "#fff",
                      fontWeight: "bold",
                    }}
                  />
                  <Typography
                    variant="h5"
                    sx={{
                      fontFamily: `'${activeSnapshot.brand.heading_font}', serif`,
                      color:
                        activeSnapshot.template.theme?.primary || "#d81b60",
                      fontWeight: 700,
                    }}
                  >
                    {activeSnapshot.brand.brand_name}
                  </Typography>
                  <Typography
                    variant="h4"
                    component="h3"
                    sx={{
                      fontFamily: `'${activeSnapshot.brand.heading_font}', serif`,
                      fontWeight: 700,
                      mt: 1,
                    }}
                  >
                    {activeSnapshot.campaign.headline}
                  </Typography>
                  {activeSnapshot.campaign.subheadline && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      {activeSnapshot.campaign.subheadline}
                    </Typography>
                  )}

                  <Grid container spacing={2} sx={{ mt: 1, mb: 2 }}>
                    {activeSnapshot.offerings.map((off) => (
                      <Grid
                        size={{
                          xs: 12,
                          sm:
                            Number(
                              activeSnapshot.template.layout_config?.columns
                            ) === 1 || activeSnapshot.offerings.length === 1
                              ? 12
                              : 6,
                        }}
                        key={`${off.kind}-${off.id}`}
                      >
                        <Card
                          variant="outlined"
                          sx={{
                            textAlign: "left",
                            borderTop: `4px solid ${
                              activeSnapshot.template.theme?.primary ||
                              "#d81b60"
                            }`,
                          }}
                        >
                          <CardContent sx={{ p: 2 }}>
                            <Box
                              display="flex"
                              justifyContent="space-between"
                              alignItems="baseline"
                              gap={1}
                            >
                              <Typography variant="subtitle1" fontWeight="bold">
                                {off.name}
                              </Typography>
                              <Typography
                                variant="h6"
                                color="primary.main"
                                fontWeight="bold"
                              >
                                {off.price_formatted}
                              </Typography>
                            </Box>
                            {off.items.map((line, idx) => (
                              <Typography
                                key={idx}
                                variant="caption"
                                display="block"
                                color="text.secondary"
                              >
                                ★ {line}
                              </Typography>
                            ))}
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>

                  {activeSnapshot.campaign.validity_note && (
                    <Typography
                      variant="caption"
                      fontWeight="bold"
                      display="block"
                      sx={{
                        color: activeSnapshot.festival.accent_color,
                        mb: 1,
                      }}
                    >
                      {activeSnapshot.campaign.validity_note}
                    </Typography>
                  )}

                  <Box
                    sx={{
                      bgcolor:
                        activeSnapshot.template.theme?.primary || "#d81b60",
                      color: "#fff",
                      p: 1.5,
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="body2" fontWeight="bold">
                      Book Now: {activeSnapshot.contact.contact_name} &bull; 📞{" "}
                      {activeSnapshot.contact.phone} &bull; WhatsApp:{" "}
                      {activeSnapshot.contact.whatsapp}
                    </Typography>
                    <Typography variant="caption" display="block">
                      📍 {activeSnapshot.contact.address}
                    </Typography>
                  </Box>
                </Box>

                {/* Canvas Renderer Surface */}
                <Box sx={{ textAlign: "center" }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    mb={1}
                  >
                    High-Resolution Canvas Render Surface (
                    {activeSnapshot.template.width} ×{" "}
                    {activeSnapshot.template.height})
                  </Typography>
                  <canvas
                    ref={canvasRef}
                    aria-label="Poster artwork canvas"
                    style={{
                      maxWidth: "100%",
                      height: "auto",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Add Custom Festival Dialog */}
      <Dialog
        open={festivalDialogOpen}
        onClose={() => !savingFestival && setFestivalDialogOpen(false)}
        aria-labelledby="add-festival-dialog-title"
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle id="add-festival-dialog-title">
          Add Custom Festival
        </DialogTitle>
        <Box component="form" noValidate onSubmit={handleCreateFestival}>
          <DialogContent>
            {festivalFormError && (
              <Alert severity="error" role="alert" sx={{ mb: 2 }}>
                {festivalFormError}
              </Alert>
            )}
            <TextField
              id="new-festival-name"
              label="Festival Name"
              fullWidth
              required
              margin="dense"
              value={newFestivalForm.name}
              onChange={(e) =>
                setNewFestivalForm((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              error={Boolean(festivalFieldErrors.name)}
              helperText={festivalFieldErrors.name}
              disabled={savingFestival}
            />
            <TextField
              id="new-festival-headline"
              label="Default Headline"
              fullWidth
              margin="dense"
              value={newFestivalForm.default_headline}
              onChange={(e) =>
                setNewFestivalForm((prev) => ({
                  ...prev,
                  default_headline: e.target.value,
                }))
              }
              error={Boolean(festivalFieldErrors.default_headline)}
              helperText={festivalFieldErrors.default_headline}
              disabled={savingFestival}
            />
            <TextField
              id="new-festival-motif"
              label="Motif Badge Text"
              fullWidth
              required
              margin="dense"
              value={newFestivalForm.motif_label}
              onChange={(e) =>
                setNewFestivalForm((prev) => ({
                  ...prev,
                  motif_label: e.target.value,
                }))
              }
              error={Boolean(festivalFieldErrors.motif_label)}
              helperText={festivalFieldErrors.motif_label}
              disabled={savingFestival}
            />
            <TextField
              id="new-festival-accent"
              label="Accent Color (Hex)"
              fullWidth
              required
              margin="dense"
              value={newFestivalForm.accent_color}
              onChange={(e) =>
                setNewFestivalForm((prev) => ({
                  ...prev,
                  accent_color: e.target.value,
                }))
              }
              error={Boolean(festivalFieldErrors.accent_color)}
              helperText={festivalFieldErrors.accent_color}
              disabled={savingFestival}
            />
          </DialogContent>
          <DialogActions>
            <Button
              type="button"
              onClick={() => setFestivalDialogOpen(false)}
              disabled={savingFestival}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={savingFestival}
            >
              {savingFestival ? "Saving..." : "Save Festival"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}


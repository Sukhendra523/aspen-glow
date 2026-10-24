import React, { useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  AppBar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  MenuItem,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import {
  EMPTY_FESTIVAL_FORM,
  FESTIVAL_CATEGORIES,
  archiveFestivalRecord,
  createFestivalRecord,
  fetchAdminFestivals,
  restoreFestivalRecord,
  updateFestivalRecord,
} from "../../services/festivalService";
import { useAuth } from "../../context/AuthContext";

const FORM_KEYS = [
  "name",
  "category",
  "default_headline",
  "default_subheadline",
  "motif_label",
  "accent_color",
  "display_order",
  "active",
];

function mapFestivalToForm(festival) {
  if (!festival) {
    return { ...EMPTY_FESTIVAL_FORM };
  }
  return {
    name: festival.name || "",
    category: festival.category || "Indian Festival",
    default_headline: festival.default_headline || "",
    default_subheadline: festival.default_subheadline || "",
    motif_label: festival.motif_label || "✨",
    accent_color: festival.accent_color || "#c2185b",
    display_order:
      festival.display_order !== undefined && festival.display_order !== null
        ? String(festival.display_order)
        : "10",
    active: festival.active !== false,
  };
}

export default function AdminFestivalsPage() {
  const { client } = useAuth();

  const [festivals, setFestivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [editingId, setEditingId] = useState(null);
  const [baselineForm, setBaselineForm] = useState({ ...EMPTY_FESTIVAL_FORM });
  const [form, setForm] = useState({ ...EMPTY_FESTIVAL_FORM });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const [archiveTarget, setArchiveTarget] = useState(null);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchAdminFestivals(client).then((result) => {
      if (!isMounted) return;
      setFestivals(result.data || []);
      setLoadError(result.error || "");
      setLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, [client]);

  const isDirty = useMemo(
    () =>
      FORM_KEYS.some(
        (key) => String(form[key] ?? "") !== String(baselineForm[key] ?? "")
      ),
    [form, baselineForm]
  );

  const filteredFestivals = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return festivals.filter((fest) => {
      if (categoryFilter !== "ALL" && fest.category !== categoryFilter) {
        return false;
      }
      if (statusFilter === "active" && fest.active === false) {
        return false;
      }
      if (statusFilter === "archived" && fest.active !== false) {
        return false;
      }
      if (query) {
        const hay = `${fest.name || ""} ${fest.category || ""} ${
          fest.default_headline || ""
        } ${fest.default_subheadline || ""} ${
          fest.motif_label || ""
        }`.toLowerCase();
        if (!hay.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [festivals, categoryFilter, statusFilter, searchQuery]);

  const handleFieldChange = (field) => (event) => {
    const value =
      field === "active"
        ? event.target.value === "true" || event.target.value === true
        : event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    setSuccessMessage("");
  };

  const resetToCreateMode = () => {
    setEditingId(null);
    const fresh = { ...EMPTY_FESTIVAL_FORM };
    setBaselineForm(fresh);
    setForm(fresh);
    setFieldErrors({});
    setFormError("");
  };

  const handleSelectEdit = (festival) => {
    const mapped = mapFestivalToForm(festival);
    setEditingId(festival.id);
    setBaselineForm(mapped);
    setForm(mapped);
    setFieldErrors({});
    setFormError("");
    setSuccessMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    setSuccessMessage("");
    setFieldErrors({});

    setSaving(true);
    const result = editingId
      ? await updateFestivalRecord(editingId, form, client)
      : await createFestivalRecord(form, client);
    setSaving(false);

    if (result.error) {
      setFieldErrors(result.fieldErrors || {});
      setFormError(result.error);
      return;
    }

    const saved = result.data;
    if (editingId) {
      setFestivals((prev) =>
        prev.map((item) => (item.id === saved.id ? saved : item))
      );
      const updatedForm = mapFestivalToForm(saved);
      setBaselineForm(updatedForm);
      setForm(updatedForm);
      setSuccessMessage(`Updated festival "${saved.name}".`);
    } else {
      setFestivals((prev) => [...prev, saved]);
      resetToCreateMode();
      setSuccessMessage(`Created festival "${saved.name}".`);
    }
  };

  const handleConfirmArchive = async () => {
    if (!archiveTarget) return;
    setArchiving(true);
    setFormError("");
    setSuccessMessage("");

    const result = await archiveFestivalRecord(archiveTarget.id, client);
    setArchiving(false);

    if (result.error) {
      setFormError(result.error);
      setArchiveTarget(null);
      return;
    }

    const updated = result.data;
    setFestivals((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
    if (editingId === updated.id) {
      const updatedForm = mapFestivalToForm(updated);
      setBaselineForm(updatedForm);
      setForm(updatedForm);
    }
    setSuccessMessage(`Archived festival "${updated.name}".`);
    setArchiveTarget(null);
  };

  const handleRestoreFestival = async (festival) => {
    setFormError("");
    setSuccessMessage("");

    const result = await restoreFestivalRecord(festival.id, client);
    if (result.error) {
      setFormError(result.error);
      return;
    }

    const updated = result.data;
    setFestivals((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
    if (editingId === updated.id) {
      const updatedForm = mapFestivalToForm(updated);
      setBaselineForm(updatedForm);
      setForm(updatedForm);
    }
    setSuccessMessage(`Activated festival "${updated.name}".`);
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
        <CircularProgress
          color="primary"
          aria-label="Loading festival catalogue"
        />
        <Typography variant="body1" color="text.secondary">
          Loading festival catalogue...
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
              Festival Management
            </Typography>
            {isDirty && (
              <Chip
                label="Unsaved changes"
                color="warning"
                size="small"
                variant="outlined"
              />
            )}
            <Button
              component={RouterLink}
              to="/admin/posters"
              variant="contained"
              color="primary"
              size="small"
            >
              Open Poster Studio
            </Button>
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

        <Grid container spacing={4}>
          {/* Create / Edit Festival Form */}
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
                    {editingId ? "Edit Festival" : "Add New Festival"}
                  </Typography>
                  {editingId && (
                    <Button
                      type="button"
                      size="small"
                      variant="text"
                      onClick={resetToCreateMode}
                    >
                      + New Festival
                    </Button>
                  )}
                </Box>

                <Box component="form" noValidate onSubmit={handleSubmit}>
                  <TextField
                    id="festival-name"
                    label="Festival Name"
                    fullWidth
                    required
                    margin="normal"
                    value={form.name}
                    onChange={handleFieldChange("name")}
                    error={Boolean(fieldErrors.name)}
                    helperText={fieldErrors.name}
                    disabled={saving}
                  />

                  <TextField
                    id="festival-category"
                    select
                    label="Festival Category"
                    fullWidth
                    required
                    margin="normal"
                    value={form.category}
                    onChange={handleFieldChange("category")}
                    error={Boolean(fieldErrors.category)}
                    helperText={fieldErrors.category}
                    disabled={saving}
                  >
                    {FESTIVAL_CATEGORIES.map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        {cat}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    id="festival-default-headline"
                    label="Default Headline"
                    fullWidth
                    margin="normal"
                    placeholder="Teej Special Offer"
                    value={form.default_headline}
                    onChange={handleFieldChange("default_headline")}
                    error={Boolean(fieldErrors.default_headline)}
                    helperText={
                      fieldErrors.default_headline ||
                      "Default poster headline when this festival is selected."
                    }
                    disabled={saving}
                  />

                  <TextField
                    id="festival-default-subheadline"
                    label="Default Subheadline"
                    fullWidth
                    multiline
                    minRows={2}
                    margin="normal"
                    placeholder="Unveil your radiant glow for Teej"
                    value={form.default_subheadline}
                    onChange={handleFieldChange("default_subheadline")}
                    error={Boolean(fieldErrors.default_subheadline)}
                    helperText={fieldErrors.default_subheadline}
                    disabled={saving}
                  />

                  <Grid container spacing={2} sx={{ mt: 0.5 }}>
                    <Grid size={{ xs: 12, sm: 7 }}>
                      <TextField
                        id="festival-motif-label"
                        label="Motif Badge Label"
                        fullWidth
                        value={form.motif_label}
                        onChange={handleFieldChange("motif_label")}
                        error={Boolean(fieldErrors.motif_label)}
                        helperText={
                          fieldErrors.motif_label || "Example: 🌸 🌿 Teej Special"
                        }
                        disabled={saving}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 5 }}>
                      <TextField
                        id="festival-display-order"
                        label="Display Order"
                        fullWidth
                        inputMode="numeric"
                        value={form.display_order}
                        onChange={handleFieldChange("display_order")}
                        disabled={saving}
                      />
                    </Grid>
                  </Grid>

                  <Grid container spacing={2} sx={{ mt: 0.5 }} alignItems="center">
                    <Grid size={{ xs: 12, sm: 7 }}>
                      <TextField
                        id="festival-accent-color"
                        label="Accent Color (Hex)"
                        type="color"
                        fullWidth
                        value={form.accent_color || "#c2185b"}
                        onChange={handleFieldChange("accent_color")}
                        error={Boolean(fieldErrors.accent_color)}
                        helperText={fieldErrors.accent_color || "Example: #c2185b"}
                        disabled={saving}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 5 }}>
                      <TextField
                        id="festival-status"
                        select
                        label="Festival Status"
                        fullWidth
                        value={String(form.active !== false)}
                        onChange={handleFieldChange("active")}
                        disabled={saving}
                      >
                        <MenuItem value="true">Active</MenuItem>
                        <MenuItem value="false">Archived</MenuItem>
                      </TextField>
                    </Grid>
                  </Grid>

                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    disabled={saving}
                    sx={{ mt: 3 }}
                  >
                    {saving
                      ? "Saving Festival..."
                      : editingId
                      ? "Update Festival"
                      : "Create Festival"}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Festival List & Filters */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="h6" component="h2" gutterBottom>
                  Filter Festivals ({filteredFestivals.length} of{" "}
                  {festivals.length})
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      id="search-festivals"
                      label="Search Festivals"
                      fullWidth
                      size="small"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      id="filter-festival-category"
                      select
                      label="Category Filter"
                      fullWidth
                      size="small"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      <MenuItem value="ALL">All Categories</MenuItem>
                      {FESTIVAL_CATEGORIES.map((cat) => (
                        <MenuItem key={cat} value={cat}>
                          {cat}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      id="filter-festival-status"
                      select
                      label="Status Filter"
                      fullWidth
                      size="small"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <MenuItem value="ALL">All Statuses</MenuItem>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="archived">Archived</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {filteredFestivals.length === 0 ? (
              <Card>
                <CardContent sx={{ textAlign: "center", py: 6 }}>
                  <Typography variant="h6" gutterBottom>
                    No festivals match the current filters.
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Add a new festival using the form or clear your search
                    filters.
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Grid container spacing={2}>
                {filteredFestivals.map((festival) => {
                  const isActive = festival.active !== false;
                  return (
                    <Grid size={{ xs: 12 }} key={festival.id}>
                      <Card
                        sx={{
                          borderLeft: "5px solid",
                          borderColor: isActive
                            ? festival.accent_color || "primary.main"
                            : "grey.400",
                        }}
                      >
                        <CardContent sx={{ pb: 1 }}>
                          <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="flex-start"
                            flexWrap="wrap"
                            gap={1}
                          >
                            <Box>
                              <Typography
                                variant="h6"
                                component="h3"
                                fontWeight="bold"
                              >
                                {festival.name}
                              </Typography>
                              {festival.default_headline && (
                                <Typography
                                  variant="subtitle2"
                                  color="primary.main"
                                  fontWeight="bold"
                                >
                                  Headline: {festival.default_headline}
                                </Typography>
                              )}
                            </Box>
                            <Box display="flex" gap={1} flexWrap="wrap">
                              <Chip
                                label={festival.motif_label || "✨"}
                                size="small"
                                sx={{
                                  bgcolor: festival.accent_color || "#c2185b",
                                  color: "#fff",
                                  fontWeight: "bold",
                                }}
                              />
                              <Chip
                                label={festival.category || "Indian Festival"}
                                size="small"
                                variant="outlined"
                              />
                              <Chip
                                label={
                                  isActive
                                    ? "Status: Active"
                                    : "Status: Archived"
                                }
                                color={isActive ? "success" : "warning"}
                                size="small"
                              />
                            </Box>
                          </Box>

                          {festival.default_subheadline && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mt: 1 }}
                            >
                              {festival.default_subheadline}
                            </Typography>
                          )}
                        </CardContent>
                        <CardActions sx={{ px: 2, pb: 2 }}>
                          <Button
                            type="button"
                            size="small"
                            variant="outlined"
                            onClick={() => handleSelectEdit(festival)}
                          >
                            Edit {festival.name}
                          </Button>
                          {isActive ? (
                            <Button
                              type="button"
                              size="small"
                              color="warning"
                              onClick={() => setArchiveTarget(festival)}
                            >
                              Archive {festival.name}
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              size="small"
                              color="success"
                              onClick={() => handleRestoreFestival(festival)}
                            >
                              Activate {festival.name}
                            </Button>
                          )}
                        </CardActions>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Grid>
        </Grid>
      </Container>

      {/* Archive Confirmation Dialog */}
      <Dialog
        open={Boolean(archiveTarget)}
        onClose={() => !archiving && setArchiveTarget(null)}
        aria-labelledby="archive-festival-dialog-title"
      >
        <DialogTitle id="archive-festival-dialog-title">
          Archive Festival?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Archiving <strong>{archiveTarget?.name}</strong> hides it from active
            poster selection while preserving all saved poster snapshots that
            reference this festival.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            type="button"
            onClick={() => setArchiveTarget(null)}
            disabled={archiving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="contained"
            color="warning"
            onClick={handleConfirmArchive}
            disabled={archiving}
          >
            {archiving ? "Archiving..." : "Confirm Archive"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


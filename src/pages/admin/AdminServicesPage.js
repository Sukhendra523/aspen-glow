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
  EMPTY_SERVICE_FORM,
  SERVICE_CATEGORIES,
  SERVICE_ICONS,
  SERVICE_STATUSES,
  formatInclusionsForInput,
  formatInrPrice,
} from "../../constants/serviceCatalogue";
import {
  archiveServiceRecord,
  createServiceRecord,
  fetchAdminServices,
  updateServiceRecord,
} from "../../services/serviceCatalogueService";
import { useAuth } from "../../context/AuthContext";

const FORM_KEYS = [
  "name",
  "category",
  "description",
  "inclusionsText",
  "price_inr",
  "price_label",
  "icon_name",
  "display_order",
  "status",
];

function mapServiceToForm(service) {
  if (!service) {
    return { ...EMPTY_SERVICE_FORM };
  }
  return {
    name: service.name || "",
    category: service.category || "Makeup & Styling",
    description: service.description || "",
    inclusionsText: formatInclusionsForInput(service.inclusions),
    price_inr:
      service.price_inr !== undefined && service.price_inr !== null
        ? String(service.price_inr)
        : "",
    price_label: service.price_label || "",
    icon_name: service.icon_name || "AutoAwesome",
    display_order:
      service.display_order !== undefined && service.display_order !== null
        ? String(service.display_order)
        : "1",
    status: service.status || "draft",
  };
}

function getStatusChipProps(status) {
  if (status === "published") {
    return { label: "Status: Published", color: "success" };
  }
  if (status === "archived") {
    return { label: "Status: Archived", color: "warning" };
  }
  return { label: "Status: Draft", color: "default" };
}

export default function AdminServicesPage() {
  const { client } = useAuth();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [editingId, setEditingId] = useState(null);
  const [baselineForm, setBaselineForm] = useState({ ...EMPTY_SERVICE_FORM });
  const [form, setForm] = useState({ ...EMPTY_SERVICE_FORM });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const [archiveTarget, setArchiveTarget] = useState(null);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchAdminServices(client).then((result) => {
      if (!isMounted) return;
      setServices(result.data);
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

  const filteredServices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return services.filter((service) => {
      if (categoryFilter !== "ALL" && service.category !== categoryFilter) {
        return false;
      }
      if (statusFilter !== "ALL" && service.status !== statusFilter) {
        return false;
      }
      if (query) {
        const hay = `${service.name || ""} ${service.description || ""} ${
          service.category || ""
        }`.toLowerCase();
        if (!hay.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [services, categoryFilter, statusFilter, searchQuery]);

  const handleFieldChange = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    setSuccessMessage("");
  };

  const resetToCreateMode = () => {
    setEditingId(null);
    const fresh = { ...EMPTY_SERVICE_FORM };
    setBaselineForm(fresh);
    setForm(fresh);
    setFieldErrors({});
    setFormError("");
  };

  const handleSelectEdit = (service) => {
    const mapped = mapServiceToForm(service);
    setEditingId(service.id);
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
      ? await updateServiceRecord(editingId, form, client)
      : await createServiceRecord(form, client);
    setSaving(false);

    if (result.error) {
      setFieldErrors(result.fieldErrors || {});
      setFormError(result.error);
      return;
    }

    const savedRecord = result.data;
    if (editingId) {
      setServices((prev) =>
        prev.map((item) => (item.id === savedRecord.id ? savedRecord : item))
      );
      const updatedForm = mapServiceToForm(savedRecord);
      setBaselineForm(updatedForm);
      setForm(updatedForm);
      setSuccessMessage(`Updated service "${savedRecord.name}".`);
    } else {
      setServices((prev) => [...prev, savedRecord]);
      resetToCreateMode();
      setSuccessMessage(`Created service "${savedRecord.name}".`);
    }
  };

  const handleConfirmArchive = async () => {
    if (!archiveTarget) return;
    setArchiving(true);
    setFormError("");
    setSuccessMessage("");

    const result = await archiveServiceRecord(archiveTarget.id, client);
    setArchiving(false);

    if (result.error) {
      setFormError(result.error);
      setArchiveTarget(null);
      return;
    }

    const updated = result.data;
    setServices((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
    if (editingId === updated.id) {
      const updatedForm = mapServiceToForm(updated);
      setBaselineForm(updatedForm);
      setForm(updatedForm);
    }
    setSuccessMessage(`Archived service "${updated.name}".`);
    setArchiveTarget(null);
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
          aria-label="Loading service catalogue"
        />
        <Typography variant="body1" color="text.secondary">
          Loading service catalogue...
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
              Service Catalogue
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
          {/* Create / Edit Form */}
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
                    {editingId ? "Edit Service" : "Add New Service"}
                  </Typography>
                  {editingId && (
                    <Button
                      type="button"
                      size="small"
                      variant="text"
                      onClick={resetToCreateMode}
                    >
                      + New Service
                    </Button>
                  )}
                </Box>

                <Box component="form" noValidate onSubmit={handleSubmit}>
                  <TextField
                    id="service-name"
                    label="Service Name"
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
                    id="service-category"
                    select
                    label="Category"
                    fullWidth
                    required
                    margin="normal"
                    value={form.category}
                    onChange={handleFieldChange("category")}
                    error={Boolean(fieldErrors.category)}
                    helperText={fieldErrors.category}
                    disabled={saving}
                  >
                    {SERVICE_CATEGORIES.map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        {cat}
                      </MenuItem>
                    ))}
                  </TextField>

                  <Grid container spacing={2} sx={{ mt: 0.5 }}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        id="service-price-inr"
                        label="Price in INR (Whole Rupees)"
                        fullWidth
                        required
                        inputMode="numeric"
                        value={form.price_inr}
                        onChange={handleFieldChange("price_inr")}
                        error={Boolean(fieldErrors.price_inr)}
                        helperText={
                          fieldErrors.price_inr || "Example: 1199"
                        }
                        disabled={saving}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        id="service-price-label"
                        label="Price Prefix (optional)"
                        fullWidth
                        placeholder="Starting from just"
                        value={form.price_label}
                        onChange={handleFieldChange("price_label")}
                        error={Boolean(fieldErrors.price_label)}
                        helperText={fieldErrors.price_label}
                        disabled={saving}
                      />
                    </Grid>
                  </Grid>

                  <Grid container spacing={2} sx={{ mt: 0.5 }}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        id="service-icon"
                        select
                        label="Service Icon"
                        fullWidth
                        value={form.icon_name}
                        onChange={handleFieldChange("icon_name")}
                        error={Boolean(fieldErrors.icon_name)}
                        helperText={fieldErrors.icon_name}
                        disabled={saving}
                      >
                        {SERVICE_ICONS.map((icon) => (
                          <MenuItem key={icon} value={icon}>
                            {icon}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        id="service-display-order"
                        label="Display Order"
                        fullWidth
                        inputMode="numeric"
                        value={form.display_order}
                        onChange={handleFieldChange("display_order")}
                        error={Boolean(fieldErrors.display_order)}
                        helperText={fieldErrors.display_order}
                        disabled={saving}
                      />
                    </Grid>
                  </Grid>

                  <TextField
                    id="service-description"
                    label="Description"
                    fullWidth
                    multiline
                    minRows={2}
                    margin="normal"
                    value={form.description}
                    onChange={handleFieldChange("description")}
                    error={Boolean(fieldErrors.description)}
                    helperText={fieldErrors.description}
                    disabled={saving}
                  />

                  <TextField
                    id="service-inclusions"
                    label="Inclusions (one per line)"
                    fullWidth
                    multiline
                    minRows={3}
                    margin="normal"
                    placeholder={"Makeup\nHairstyling\nSaree Draping"}
                    value={form.inclusionsText}
                    onChange={handleFieldChange("inclusionsText")}
                    error={Boolean(fieldErrors.inclusions)}
                    helperText={
                      fieldErrors.inclusions ||
                      "Optional bullet points displayed on service cards."
                    }
                    disabled={saving}
                  />

                  <TextField
                    id="service-status"
                    select
                    label="Publication Status"
                    fullWidth
                    margin="normal"
                    value={form.status}
                    onChange={handleFieldChange("status")}
                    error={Boolean(fieldErrors.status)}
                    helperText={fieldErrors.status}
                    disabled={saving}
                  >
                    {SERVICE_STATUSES.map((st) => (
                      <MenuItem key={st} value={st}>
                        {st === "published"
                          ? "Published (visible on public site)"
                          : st === "archived"
                          ? "Archived (deactivated, preserves package history)"
                          : "Draft (hidden from public site)"}
                      </MenuItem>
                    ))}
                  </TextField>

                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    disabled={saving}
                    sx={{ mt: 3 }}
                  >
                    {saving
                      ? "Saving Service..."
                      : editingId
                      ? "Update Service"
                      : "Create Service"}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Service Catalogue List & Filters */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="h6" component="h2" gutterBottom>
                  Filter Catalogue ({filteredServices.length} of{" "}
                  {services.length})
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      id="search-services"
                      label="Search Services"
                      fullWidth
                      size="small"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      id="filter-category"
                      select
                      label="Category Filter"
                      fullWidth
                      size="small"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      <MenuItem value="ALL">All Categories</MenuItem>
                      {SERVICE_CATEGORIES.map((cat) => (
                        <MenuItem key={cat} value={cat}>
                          {cat}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      id="filter-status"
                      select
                      label="Status Filter"
                      fullWidth
                      size="small"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <MenuItem value="ALL">All Statuses</MenuItem>
                      <MenuItem value="published">Published</MenuItem>
                      <MenuItem value="draft">Draft</MenuItem>
                      <MenuItem value="archived">Archived</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {filteredServices.length === 0 ? (
              <Card>
                <CardContent sx={{ textAlign: "center", py: 6 }}>
                  <Typography variant="h6" gutterBottom>
                    No services match the current filters.
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Add a new service using the form or clear your search
                    filters.
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Grid container spacing={2}>
                {filteredServices.map((service) => {
                  const statusChip = getStatusChipProps(service.status);
                  const inclusions = Array.isArray(service.inclusions)
                    ? service.inclusions
                    : [];
                  return (
                    <Grid size={{ xs: 12 }} key={service.id}>
                      <Card
                        sx={{
                          borderLeft: "4px solid",
                          borderColor:
                            service.status === "published"
                              ? "primary.main"
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
                                {service.name}
                              </Typography>
                              <Typography
                                variant="subtitle1"
                                color="primary.main"
                                fontWeight="bold"
                              >
                                {formatInrPrice(
                                  service.price_inr,
                                  service.price_label
                                )}
                              </Typography>
                            </Box>
                            <Box display="flex" gap={1} flexWrap="wrap">
                              <Chip
                                label={service.category}
                                size="small"
                                variant="outlined"
                              />
                              <Chip
                                label={statusChip.label}
                                color={statusChip.color}
                                size="small"
                              />
                            </Box>
                          </Box>

                          {service.description && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mt: 1 }}
                            >
                              {service.description}
                            </Typography>
                          )}

                          {inclusions.length > 0 && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                              sx={{ mt: 1 }}
                            >
                              Inclusions: {inclusions.join(" • ")}
                            </Typography>
                          )}
                        </CardContent>
                        <CardActions sx={{ px: 2, pb: 2 }}>
                          <Button
                            type="button"
                            size="small"
                            variant="outlined"
                            onClick={() => handleSelectEdit(service)}
                          >
                            Edit {service.name}
                          </Button>
                          {service.status !== "archived" && (
                            <Button
                              type="button"
                              size="small"
                              color="warning"
                              onClick={() => setArchiveTarget(service)}
                            >
                              Archive {service.name}
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
        aria-labelledby="archive-service-dialog-title"
      >
        <DialogTitle id="archive-service-dialog-title">
          Archive Service?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Archiving <strong>{archiveTarget?.name}</strong> hides it from the
            public website while preserving existing package relationships and
            saved poster snapshots.
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


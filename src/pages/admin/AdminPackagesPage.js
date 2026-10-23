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
  Divider,
  Grid,
  MenuItem,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import {
  SERVICE_ICONS,
  SERVICE_STATUSES,
  formatInrPrice,
} from "../../constants/serviceCatalogue";
import { fetchAdminServices } from "../../services/serviceCatalogueService";
import {
  EMPTY_PACKAGE_FORM,
  PACKAGE_GROUPS,
  archivePackageRecord,
  createPackageRecord,
  fetchAdminPackages,
  formatPackageServiceLine,
  updatePackageRecord,
} from "../../services/packageService";
import { useAuth } from "../../context/AuthContext";

function mapPackageToForm(pkg) {
  if (!pkg) {
    return { ...EMPTY_PACKAGE_FORM, service_items: [] };
  }
  const items = Array.isArray(pkg.package_services)
    ? pkg.package_services.map((ps, index) => ({
        service_id: ps.service_id || ps.service?.id || "",
        inclusion_note: ps.inclusion_note || "",
        display_order: ps.display_order ?? index + 1,
      }))
    : [];

  return {
    name: pkg.name || "",
    description: pkg.description || "",
    price_inr:
      pkg.price_inr !== undefined && pkg.price_inr !== null
        ? String(pkg.price_inr)
        : "",
    icon_name: pkg.icon_name || "AutoAwesome",
    display_order:
      pkg.display_order !== undefined && pkg.display_order !== null
        ? String(pkg.display_order)
        : "1",
    status: pkg.status || "draft",
    package_group: pkg.package_group || "Multi-Service Packages",
    tagline: pkg.tagline || "",
    badge_text: pkg.badge_text || "",
    card_color: pkg.card_color || "",
    service_items: items,
  };
}

function serializePackageForm(form) {
  return JSON.stringify({
    name: form.name || "",
    description: form.description || "",
    price_inr: String(form.price_inr ?? ""),
    icon_name: form.icon_name || "AutoAwesome",
    display_order: String(form.display_order ?? "1"),
    status: form.status || "draft",
    package_group: form.package_group || "Multi-Service Packages",
    tagline: form.tagline || "",
    badge_text: form.badge_text || "",
    card_color: form.card_color || "",
    service_items: (form.service_items || []).map((item) => ({
      service_id: item.service_id || "",
      inclusion_note: item.inclusion_note || "",
    })),
  });
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

export default function AdminPackagesPage() {
  const { client } = useAuth();

  const [packages, setPackages] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [editingId, setEditingId] = useState(null);
  const [baselineForm, setBaselineForm] = useState(() =>
    mapPackageToForm(null)
  );
  const [form, setForm] = useState(() => mapPackageToForm(null));
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedServiceNote, setSelectedServiceNote] = useState("");

  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const [archiveTarget, setArchiveTarget] = useState(null);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    Promise.all([fetchAdminPackages(client), fetchAdminServices(client)]).then(
      ([pkgRes, svcRes]) => {
        if (!isMounted) return;
        setPackages(pkgRes.data);
        setServices(svcRes.data);
        setLoadError(pkgRes.error || svcRes.error || "");
        setLoading(false);
      }
    );
    return () => {
      isMounted = false;
    };
  }, [client]);

  const serviceById = useMemo(() => {
    const map = new Map();
    services.forEach((svc) => map.set(svc.id, svc));
    return map;
  }, [services]);

  const selectableServices = useMemo(() => {
    const chosenIds = new Set(
      (form.service_items || []).map((item) => item.service_id)
    );
    return services.filter(
      (svc) => svc.status !== "archived" && !chosenIds.has(svc.id)
    );
  }, [services, form.service_items]);

  const standaloneSumInr = useMemo(
    () =>
      (form.service_items || []).reduce((acc, item) => {
        const svc = serviceById.get(item.service_id);
        return acc + (Number(svc?.price_inr) || 0);
      }, 0),
    [form.service_items, serviceById]
  );

  const isDirty = useMemo(
    () => serializePackageForm(form) !== serializePackageForm(baselineForm),
    [form, baselineForm]
  );

  const filteredPackages = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return packages.filter((pkg) => {
      if (statusFilter !== "ALL" && pkg.status !== statusFilter) {
        return false;
      }
      if (query) {
        const itemsText = Array.isArray(pkg.items) ? pkg.items.join(" ") : "";
        const hay = `${pkg.name || ""} ${
          pkg.description || ""
        } ${itemsText}`.toLowerCase();
        if (!hay.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [packages, statusFilter, searchQuery]);

  const handleFieldChange = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    setSuccessMessage("");
  };

  const handleAddServiceItem = () => {
    if (!selectedServiceId) return;
    setForm((prev) => ({
      ...prev,
      service_items: [
        ...(prev.service_items || []),
        {
          service_id: selectedServiceId,
          inclusion_note: selectedServiceNote.trim(),
          display_order: (prev.service_items || []).length + 1,
        },
      ],
    }));
    setSelectedServiceId("");
    setSelectedServiceNote("");
    setFieldErrors((prev) => ({ ...prev, service_items: undefined }));
    setSuccessMessage("");
  };

  const handleRemoveServiceItem = (serviceId) => {
    setForm((prev) => ({
      ...prev,
      service_items: (prev.service_items || [])
        .filter((item) => item.service_id !== serviceId)
        .map((item, idx) => ({ ...item, display_order: idx + 1 })),
    }));
    setSuccessMessage("");
  };

  const handleMoveServiceItem = (index, direction) => {
    setForm((prev) => {
      const next = [...(prev.service_items || [])];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= next.length) {
        return prev;
      }
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return {
        ...prev,
        service_items: next.map((item, idx) => ({
          ...item,
          display_order: idx + 1,
        })),
      };
    });
    setSuccessMessage("");
  };

  const handleItemNoteChange = (serviceId, nextNote) => {
    setForm((prev) => ({
      ...prev,
      service_items: (prev.service_items || []).map((item) =>
        item.service_id === serviceId
          ? { ...item, inclusion_note: nextNote }
          : item
      ),
    }));
    setSuccessMessage("");
  };

  const resetToCreateMode = () => {
    setEditingId(null);
    const fresh = mapPackageToForm(null);
    setBaselineForm(fresh);
    setForm(fresh);
    setSelectedServiceId("");
    setSelectedServiceNote("");
    setFieldErrors({});
    setFormError("");
  };

  const handleSelectEdit = (pkg) => {
    const mapped = mapPackageToForm(pkg);
    setEditingId(pkg.id);
    setBaselineForm(mapped);
    setForm(mapped);
    setSelectedServiceId("");
    setSelectedServiceNote("");
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
      ? await updatePackageRecord(editingId, form, client)
      : await createPackageRecord(form, client);
    setSaving(false);

    if (result.error) {
      setFieldErrors(result.fieldErrors || {});
      setFormError(result.error);
      return;
    }

    const saved = result.data;
    if (editingId) {
      setPackages((prev) =>
        prev.map((item) => (item.id === saved.id ? saved : item))
      );
      const updatedForm = mapPackageToForm(saved);
      setBaselineForm(updatedForm);
      setForm(updatedForm);
      setSuccessMessage(`Updated package "${saved.name}".`);
    } else {
      setPackages((prev) => [...prev, saved]);
      resetToCreateMode();
      setSuccessMessage(`Created package "${saved.name}".`);
    }
  };

  const handleConfirmArchive = async () => {
    if (!archiveTarget) return;
    setArchiving(true);
    setFormError("");
    setSuccessMessage("");

    const result = await archivePackageRecord(archiveTarget.id, client);
    setArchiving(false);

    if (result.error) {
      setFormError(result.error);
      setArchiveTarget(null);
      return;
    }

    const updated = result.data;
    setPackages((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
    if (editingId === updated.id) {
      const updatedForm = mapPackageToForm(updated);
      setBaselineForm(updatedForm);
      setForm(updatedForm);
    }
    setSuccessMessage(`Archived package "${updated.name}".`);
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
          aria-label="Loading package catalogue"
        />
        <Typography variant="body1" color="text.secondary">
          Loading package catalogue...
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
              Package Management
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
          {/* Create / Edit Package Form */}
          <Grid size={{ xs: 12, md: 6 }}>
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
                    {editingId ? "Edit Package" : "Create New Package"}
                  </Typography>
                  {editingId && (
                    <Button
                      type="button"
                      size="small"
                      variant="text"
                      onClick={resetToCreateMode}
                    >
                      + New Package
                    </Button>
                  )}
                </Box>

                <Box component="form" noValidate onSubmit={handleSubmit}>
                  <TextField
                    id="package-name"
                    label="Package Name"
                    fullWidth
                    required
                    margin="normal"
                    value={form.name}
                    onChange={handleFieldChange("name")}
                    error={Boolean(fieldErrors.name)}
                    helperText={fieldErrors.name}
                    disabled={saving}
                  />

                  <Grid container spacing={2} sx={{ mt: 0.5 }}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        id="package-price-inr"
                        label="Package Price in INR (Whole Rupees)"
                        fullWidth
                        required
                        inputMode="numeric"
                        value={form.price_inr}
                        onChange={handleFieldChange("price_inr")}
                        error={Boolean(fieldErrors.price_inr)}
                        helperText={
                          fieldErrors.price_inr ||
                          "Standalone package price (e.g. 799)"
                        }
                        disabled={saving}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        id="package-display-order"
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

                  <Grid container spacing={2} sx={{ mt: 0.5 }}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        id="package-icon"
                        select
                        label="Package Icon"
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
                        id="package-status"
                        select
                        label="Publication Status"
                        fullWidth
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
                              ? "Archived (deactivated)"
                              : "Draft (hidden from public site)"}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                  </Grid>

                  <TextField
                    id="package-description"
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

                  <Grid container spacing={2} sx={{ mt: 0.5 }}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        id="package-group"
                        select
                        label="Package Group (Poster Category)"
                        fullWidth
                        size="small"
                        value={form.package_group || "Multi-Service Packages"}
                        onChange={handleFieldChange("package_group")}
                        disabled={saving}
                      >
                        {PACKAGE_GROUPS.map((grp) => (
                          <MenuItem key={grp} value={grp}>
                            {grp}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        id="package-badge-text"
                        label="Poster Badge (e.g. MOST POPULAR)"
                        fullWidth
                        size="small"
                        value={form.badge_text || ""}
                        onChange={handleFieldChange("badge_text")}
                        disabled={saving}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 8 }}>
                      <TextField
                        id="package-tagline"
                        label="Poster Card Tagline (e.g. SAVE MORE | LOOK BEAUTIFUL)"
                        fullWidth
                        size="small"
                        value={form.tagline || ""}
                        onChange={handleFieldChange("tagline")}
                        disabled={saving}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        id="package-card-color"
                        label="Poster Card Color Hex"
                        fullWidth
                        size="small"
                        placeholder="#4e1014"
                        value={form.card_color || ""}
                        onChange={handleFieldChange("card_color")}
                        disabled={saving}
                      />
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2.5 }} />

                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Included Services ({(form.service_items || []).length})
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    mb={2}
                  >
                    Sum of standalone service prices:{" "}
                    <strong>{formatInrPrice(standaloneSumInr)}</strong> &bull;
                    Package price is set independently above.
                  </Typography>

                  {fieldErrors.service_items && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {fieldErrors.service_items}
                    </Alert>
                  )}

                  <Grid container spacing={1.5} alignItems="center" mb={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        id="add-package-service-select"
                        select
                        label="Select Service to Add"
                        fullWidth
                        size="small"
                        value={selectedServiceId}
                        onChange={(e) => setSelectedServiceId(e.target.value)}
                        disabled={saving}
                      >
                        <MenuItem value="">
                          <em>Choose a service...</em>
                        </MenuItem>
                        {selectableServices.map((svc) => (
                          <MenuItem key={svc.id} value={svc.id}>
                            {svc.name} ({formatInrPrice(svc.price_inr)})
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        id="add-package-service-note"
                        label="Inclusion Note (optional)"
                        fullWidth
                        size="small"
                        placeholder="🎉 Free"
                        value={selectedServiceNote}
                        onChange={(e) => setSelectedServiceNote(e.target.value)}
                        disabled={saving}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 2 }}>
                      <Button
                        type="button"
                        variant="outlined"
                        fullWidth
                        onClick={handleAddServiceItem}
                        disabled={!selectedServiceId || saving}
                      >
                        Add
                      </Button>
                    </Grid>
                  </Grid>

                  {(form.service_items || []).length === 0 ? (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ py: 1.5 }}
                    >
                      No services added to this package yet.
                    </Typography>
                  ) : (
                    <Box display="flex" flexDirection="column" gap={1.5}>
                      {(form.service_items || []).map((item, idx) => {
                        const svc = serviceById.get(item.service_id);
                        const svcName = svc?.name || item.service_id;
                        return (
                          <Card
                            key={item.service_id}
                            variant="outlined"
                            sx={{ p: 1.5 }}
                          >
                            <Box
                              display="flex"
                              justifyContent="space-between"
                              alignItems="center"
                              flexWrap="wrap"
                              gap={1}
                            >
                              <Typography variant="body2" fontWeight="bold">
                                {idx + 1}. {svcName}
                              </Typography>
                              <Box display="flex" gap={1}>
                                <Button
                                  type="button"
                                  size="small"
                                  disabled={idx === 0 || saving}
                                  onClick={() => handleMoveServiceItem(idx, -1)}
                                >
                                  Move Up
                                </Button>
                                <Button
                                  type="button"
                                  size="small"
                                  disabled={
                                    idx === form.service_items.length - 1 ||
                                    saving
                                  }
                                  onClick={() => handleMoveServiceItem(idx, 1)}
                                >
                                  Move Down
                                </Button>
                                <Button
                                  type="button"
                                  size="small"
                                  color="error"
                                  disabled={saving}
                                  onClick={() =>
                                    handleRemoveServiceItem(item.service_id)
                                  }
                                >
                                  Remove {svcName}
                                </Button>
                              </Box>
                            </Box>
                            <TextField
                              label={`Note for ${svcName}`}
                              size="small"
                              fullWidth
                              sx={{ mt: 1 }}
                              value={item.inclusion_note}
                              onChange={(e) =>
                                handleItemNoteChange(
                                  item.service_id,
                                  e.target.value
                                )
                              }
                              disabled={saving}
                            />
                          </Card>
                        );
                      })}
                    </Box>
                  )}

                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    disabled={saving}
                    sx={{ mt: 3 }}
                  >
                    {saving
                      ? "Saving Package..."
                      : editingId
                      ? "Update Package"
                      : "Create Package"}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Package Catalogue List */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="h6" component="h2" gutterBottom>
                  Filter Packages ({filteredPackages.length} of{" "}
                  {packages.length})
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 7 }}>
                    <TextField
                      id="search-packages"
                      label="Search Packages"
                      fullWidth
                      size="small"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 5 }}>
                    <TextField
                      id="filter-package-status"
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

            {filteredPackages.length === 0 ? (
              <Card>
                <CardContent sx={{ textAlign: "center", py: 6 }}>
                  <Typography variant="h6" gutterBottom>
                    No packages match the current filters.
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Create a package using the form or clear your search
                    filters.
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Grid container spacing={2}>
                {filteredPackages.map((pkg) => {
                  const statusChip = getStatusChipProps(pkg.status);
                  const displayLines = Array.isArray(pkg.package_services)
                    ? pkg.package_services.map((ps) =>
                        formatPackageServiceLine({
                          ...ps,
                          service_name:
                            ps.service?.name ||
                            serviceById.get(ps.service_id)?.name ||
                            "",
                        })
                      )
                    : pkg.items || [];

                  return (
                    <Grid size={{ xs: 12 }} key={pkg.id}>
                      <Card
                        sx={{
                          borderLeft: "4px solid",
                          borderColor:
                            pkg.status === "published"
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
                                {pkg.name}
                              </Typography>
                              <Typography
                                variant="subtitle1"
                                color="primary.main"
                                fontWeight="bold"
                              >
                                {formatInrPrice(pkg.price_inr)}
                              </Typography>
                            </Box>
                            <Chip
                              label={statusChip.label}
                              color={statusChip.color}
                              size="small"
                            />
                          </Box>

                          {pkg.description && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mt: 1 }}
                            >
                              {pkg.description}
                            </Typography>
                          )}

                          {displayLines.length > 0 && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                              sx={{ mt: 1 }}
                            >
                              Services: {displayLines.join(" • ")}
                            </Typography>
                          )}
                        </CardContent>
                        <CardActions sx={{ px: 2, pb: 2 }}>
                          <Button
                            type="button"
                            size="small"
                            variant="outlined"
                            onClick={() => handleSelectEdit(pkg)}
                          >
                            Edit {pkg.name}
                          </Button>
                          {pkg.status !== "archived" && (
                            <Button
                              type="button"
                              size="small"
                              color="warning"
                              onClick={() => setArchiveTarget(pkg)}
                            >
                              Archive {pkg.name}
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
        aria-labelledby="archive-package-dialog-title"
      >
        <DialogTitle id="archive-package-dialog-title">
          Archive Package?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Archiving <strong>{archiveTarget?.name}</strong> hides it from the
            public website while preserving existing bundle references and saved
            poster snapshots.
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


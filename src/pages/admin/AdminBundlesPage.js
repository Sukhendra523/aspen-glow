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
import { fetchAdminPackages } from "../../services/packageService";
import {
  EMPTY_BUNDLE_FORM,
  archiveBundleRecord,
  createBundleRecord,
  fetchAdminBundles,
  formatBundlePackageLine,
  updateBundleRecord,
} from "../../services/bundleService";
import { useAuth } from "../../context/AuthContext";

function mapBundleToForm(bundle) {
  if (!bundle) {
    return { ...EMPTY_BUNDLE_FORM, package_items: [] };
  }
  const items = Array.isArray(bundle.bundle_packages)
    ? bundle.bundle_packages.map((bp, index) => ({
        package_id: bp.package_id || bp.package?.id || "",
        display_order: bp.display_order ?? index + 1,
      }))
    : [];

  return {
    name: bundle.name || "",
    description: bundle.description || "",
    price_inr:
      bundle.price_inr !== undefined && bundle.price_inr !== null
        ? String(bundle.price_inr)
        : "",
    icon_name: bundle.icon_name || "Star",
    display_order:
      bundle.display_order !== undefined && bundle.display_order !== null
        ? String(bundle.display_order)
        : "1",
    status: bundle.status || "draft",
    package_items: items,
  };
}

function serializeBundleForm(form) {
  return JSON.stringify({
    name: form.name || "",
    description: form.description || "",
    price_inr: String(form.price_inr ?? ""),
    icon_name: form.icon_name || "Star",
    display_order: String(form.display_order ?? "1"),
    status: form.status || "draft",
    package_items: (form.package_items || []).map((item) => ({
      package_id: item.package_id || "",
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

export default function AdminBundlesPage() {
  const { client } = useAuth();

  const [bundles, setBundles] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [editingId, setEditingId] = useState(null);
  const [baselineForm, setBaselineForm] = useState(() => mapBundleToForm(null));
  const [form, setForm] = useState(() => mapBundleToForm(null));
  const [selectedPackageId, setSelectedPackageId] = useState("");

  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const [archiveTarget, setArchiveTarget] = useState(null);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    Promise.all([fetchAdminBundles(client), fetchAdminPackages(client)]).then(
      ([bundleRes, pkgRes]) => {
        if (!isMounted) return;
        setBundles(bundleRes.data);
        setPackages(pkgRes.data);
        setLoadError(bundleRes.error || pkgRes.error || "");
        setLoading(false);
      }
    );
    return () => {
      isMounted = false;
    };
  }, [client]);

  const packageById = useMemo(() => {
    const map = new Map();
    packages.forEach((pkg) => map.set(pkg.id, pkg));
    return map;
  }, [packages]);

  const selectablePackages = useMemo(() => {
    const chosenIds = new Set(
      (form.package_items || []).map((item) => item.package_id)
    );
    return packages.filter(
      (pkg) => pkg.status !== "archived" && !chosenIds.has(pkg.id)
    );
  }, [packages, form.package_items]);

  const packagesSumInr = useMemo(
    () =>
      (form.package_items || []).reduce((acc, item) => {
        const pkg = packageById.get(item.package_id);
        return acc + (Number(pkg?.price_inr) || 0);
      }, 0),
    [form.package_items, packageById]
  );

  const savingsInr = useMemo(() => {
    const promo = Number(form.price_inr);
    if (!Number.isInteger(promo) || promo < 0 || packagesSumInr <= promo) {
      return 0;
    }
    return packagesSumInr - promo;
  }, [form.price_inr, packagesSumInr]);

  const isDirty = useMemo(
    () => serializeBundleForm(form) !== serializeBundleForm(baselineForm),
    [form, baselineForm]
  );

  const filteredBundles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return bundles.filter((bundle) => {
      if (statusFilter !== "ALL" && bundle.status !== statusFilter) {
        return false;
      }
      if (query) {
        const itemsText = Array.isArray(bundle.items)
          ? bundle.items.join(" ")
          : "";
        const hay = `${bundle.name || ""} ${
          bundle.description || ""
        } ${itemsText}`.toLowerCase();
        if (!hay.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [bundles, statusFilter, searchQuery]);

  const handleFieldChange = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    setSuccessMessage("");
  };

  const handleAddPackageItem = () => {
    if (!selectedPackageId) return;
    setForm((prev) => ({
      ...prev,
      package_items: [
        ...(prev.package_items || []),
        {
          package_id: selectedPackageId,
          display_order: (prev.package_items || []).length + 1,
        },
      ],
    }));
    setSelectedPackageId("");
    setFieldErrors((prev) => ({ ...prev, package_items: undefined }));
    setSuccessMessage("");
  };

  const handleRemovePackageItem = (packageId) => {
    setForm((prev) => ({
      ...prev,
      package_items: (prev.package_items || [])
        .filter((item) => item.package_id !== packageId)
        .map((item, idx) => ({ ...item, display_order: idx + 1 })),
    }));
    setSuccessMessage("");
  };

  const handleMovePackageItem = (index, direction) => {
    setForm((prev) => {
      const next = [...(prev.package_items || [])];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= next.length) {
        return prev;
      }
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return {
        ...prev,
        package_items: next.map((item, idx) => ({
          ...item,
          display_order: idx + 1,
        })),
      };
    });
    setSuccessMessage("");
  };

  const resetToCreateMode = () => {
    setEditingId(null);
    const fresh = mapBundleToForm(null);
    setBaselineForm(fresh);
    setForm(fresh);
    setSelectedPackageId("");
    setFieldErrors({});
    setFormError("");
  };

  const handleSelectEdit = (bundle) => {
    const mapped = mapBundleToForm(bundle);
    setEditingId(bundle.id);
    setBaselineForm(mapped);
    setForm(mapped);
    setSelectedPackageId("");
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
      ? await updateBundleRecord(editingId, form, client)
      : await createBundleRecord(form, client);
    setSaving(false);

    if (result.error) {
      setFieldErrors(result.fieldErrors || {});
      setFormError(result.error);
      return;
    }

    const saved = result.data;
    if (editingId) {
      setBundles((prev) =>
        prev.map((item) => (item.id === saved.id ? saved : item))
      );
      const updatedForm = mapBundleToForm(saved);
      setBaselineForm(updatedForm);
      setForm(updatedForm);
      setSuccessMessage(`Updated bundle "${saved.name}".`);
    } else {
      setBundles((prev) => [...prev, saved]);
      resetToCreateMode();
      setSuccessMessage(`Created bundle "${saved.name}".`);
    }
  };

  const handleConfirmArchive = async () => {
    if (!archiveTarget) return;
    setArchiving(true);
    setFormError("");
    setSuccessMessage("");

    const result = await archiveBundleRecord(archiveTarget.id, client);
    setArchiving(false);

    if (result.error) {
      setFormError(result.error);
      setArchiveTarget(null);
      return;
    }

    const updated = result.data;
    setBundles((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
    if (editingId === updated.id) {
      const updatedForm = mapBundleToForm(updated);
      setBaselineForm(updatedForm);
      setForm(updatedForm);
    }
    setSuccessMessage(`Archived bundle "${updated.name}".`);
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
          aria-label="Loading bundle catalogue"
        />
        <Typography variant="body1" color="text.secondary">
          Loading bundle catalogue...
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
              Bundle Management
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
          {/* Create / Edit Bundle Form */}
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
                    {editingId ? "Edit Bundle" : "Create New Bundle"}
                  </Typography>
                  {editingId && (
                    <Button
                      type="button"
                      size="small"
                      variant="text"
                      onClick={resetToCreateMode}
                    >
                      + New Bundle
                    </Button>
                  )}
                </Box>

                <Box component="form" noValidate onSubmit={handleSubmit}>
                  <TextField
                    id="bundle-name"
                    label="Bundle Name"
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
                        id="bundle-price-inr"
                        label="Promotional Price in INR (Whole Rupees)"
                        fullWidth
                        required
                        inputMode="numeric"
                        value={form.price_inr}
                        onChange={handleFieldChange("price_inr")}
                        error={Boolean(fieldErrors.price_inr)}
                        helperText={
                          fieldErrors.price_inr ||
                          "Promotional bundle price (e.g. 2499)"
                        }
                        disabled={saving}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        id="bundle-display-order"
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
                        id="bundle-icon"
                        select
                        label="Bundle Icon"
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
                        id="bundle-status"
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
                    id="bundle-description"
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

                  <Divider sx={{ my: 2.5 }} />

                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Included Packages ({(form.package_items || []).length})
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    mb={2}
                  >
                    Sum of component package prices:{" "}
                    <strong>{formatInrPrice(packagesSumInr)}</strong>
                    {savingsInr > 0 && (
                      <>
                        {" "}
                        &bull; Customer saves{" "}
                        <strong>{formatInrPrice(savingsInr)}</strong>
                      </>
                    )}
                  </Typography>

                  {fieldErrors.package_items && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {fieldErrors.package_items}
                    </Alert>
                  )}

                  <Grid container spacing={1.5} alignItems="center" mb={2}>
                    <Grid size={{ xs: 12, sm: 9 }}>
                      <TextField
                        id="add-bundle-package-select"
                        select
                        label="Select Package to Add"
                        fullWidth
                        size="small"
                        value={selectedPackageId}
                        onChange={(e) => setSelectedPackageId(e.target.value)}
                        disabled={saving}
                      >
                        <MenuItem value="">
                          <em>Choose a package...</em>
                        </MenuItem>
                        {selectablePackages.map((pkg) => (
                          <MenuItem key={pkg.id} value={pkg.id}>
                            {pkg.name} ({formatInrPrice(pkg.price_inr)})
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <Button
                        type="button"
                        variant="outlined"
                        fullWidth
                        onClick={handleAddPackageItem}
                        disabled={!selectedPackageId || saving}
                      >
                        Add
                      </Button>
                    </Grid>
                  </Grid>

                  {(form.package_items || []).length === 0 ? (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ py: 1.5 }}
                    >
                      No packages added to this bundle yet.
                    </Typography>
                  ) : (
                    <Box display="flex" flexDirection="column" gap={1.5}>
                      {(form.package_items || []).map((item, idx) => {
                        const pkg = packageById.get(item.package_id);
                        const pkgName = pkg?.name || item.package_id;
                        return (
                          <Card
                            key={item.package_id}
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
                                {idx + 1}. {pkgName}
                                {pkg?.price_inr !== undefined
                                  ? ` (${formatInrPrice(pkg.price_inr)})`
                                  : ""}
                              </Typography>
                              <Box display="flex" gap={1}>
                                <Button
                                  type="button"
                                  size="small"
                                  disabled={idx === 0 || saving}
                                  onClick={() => handleMovePackageItem(idx, -1)}
                                >
                                  Move Up
                                </Button>
                                <Button
                                  type="button"
                                  size="small"
                                  disabled={
                                    idx === form.package_items.length - 1 ||
                                    saving
                                  }
                                  onClick={() => handleMovePackageItem(idx, 1)}
                                >
                                  Move Down
                                </Button>
                                <Button
                                  type="button"
                                  size="small"
                                  color="error"
                                  disabled={saving}
                                  onClick={() =>
                                    handleRemovePackageItem(item.package_id)
                                  }
                                >
                                  Remove {pkgName}
                                </Button>
                              </Box>
                            </Box>
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
                      ? "Saving Bundle..."
                      : editingId
                      ? "Update Bundle"
                      : "Create Bundle"}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Bundle Catalogue List */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="h6" component="h2" gutterBottom>
                  Filter Bundles ({filteredBundles.length} of {bundles.length})
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 7 }}>
                    <TextField
                      id="search-bundles"
                      label="Search Bundles"
                      fullWidth
                      size="small"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 5 }}>
                    <TextField
                      id="filter-bundle-status"
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

            {filteredBundles.length === 0 ? (
              <Card>
                <CardContent sx={{ textAlign: "center", py: 6 }}>
                  <Typography variant="h6" gutterBottom>
                    No bundles match the current filters.
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Combine existing packages into a promotional bundle using
                    the form.
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Grid container spacing={2}>
                {filteredBundles.map((bundle) => {
                  const statusChip = getStatusChipProps(bundle.status);
                  const displayLines = Array.isArray(bundle.bundle_packages)
                    ? bundle.bundle_packages.map((bp) =>
                        formatBundlePackageLine({
                          ...bp,
                          package_name:
                            bp.package?.name ||
                            packageById.get(bp.package_id)?.name ||
                            "",
                        })
                      )
                    : bundle.items || [];

                  return (
                    <Grid size={{ xs: 12 }} key={bundle.id}>
                      <Card
                        sx={{
                          borderLeft: "4px solid",
                          borderColor:
                            bundle.status === "published"
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
                                {bundle.name}
                              </Typography>
                              <Typography
                                variant="subtitle1"
                                color="primary.main"
                                fontWeight="bold"
                              >
                                {formatInrPrice(bundle.price_inr)}
                              </Typography>
                            </Box>
                            <Chip
                              label={statusChip.label}
                              color={statusChip.color}
                              size="small"
                            />
                          </Box>

                          {bundle.description && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mt: 1 }}
                            >
                              {bundle.description}
                            </Typography>
                          )}

                          {displayLines.length > 0 && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                              sx={{ mt: 1 }}
                            >
                              Packages: {displayLines.join(" • ")}
                            </Typography>
                          )}
                        </CardContent>
                        <CardActions sx={{ px: 2, pb: 2 }}>
                          <Button
                            type="button"
                            size="small"
                            variant="outlined"
                            onClick={() => handleSelectEdit(bundle)}
                          >
                            Edit {bundle.name}
                          </Button>
                          {bundle.status !== "archived" && (
                            <Button
                              type="button"
                              size="small"
                              color="warning"
                              onClick={() => setArchiveTarget(bundle)}
                            >
                              Archive {bundle.name}
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
        aria-labelledby="archive-bundle-dialog-title"
      >
        <DialogTitle id="archive-bundle-dialog-title">
          Archive Bundle?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Archiving <strong>{archiveTarget?.name}</strong> hides it from the
            public website while preserving saved poster snapshots.
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


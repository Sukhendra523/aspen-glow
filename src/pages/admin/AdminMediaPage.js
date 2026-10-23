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
  MEDIA_CATEGORIES,
  applyAssetAsBrandLogo,
  archiveMediaAsset,
  fetchAdminMediaAssets,
  formatFileSize,
  uploadMediaAsset,
} from "../../services/mediaService";
import { useAuth } from "../../context/AuthContext";

function formatCategoryLabel(category) {
  if (category === "poster_motif") return "Poster Motif";
  if (category === "general") return "General";
  return "Brand Logo";
}

export default function AdminMediaPage() {
  const { client } = useAuth();

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [label, setLabel] = useState("");
  const [category, setCategory] = useState("logo");
  const [selectedFile, setSelectedFile] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [applyingLogoId, setApplyingLogoId] = useState(null);

  const [archiveTarget, setArchiveTarget] = useState(null);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchAdminMediaAssets(client).then((result) => {
      if (!isMounted) return;
      setAssets(result.data);
      setLoadError(result.error || "");
      setLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, [client]);

  const filteredAssets = useMemo(
    () =>
      assets.filter((asset) => {
        if (categoryFilter !== "ALL" && asset.category !== categoryFilter) {
          return false;
        }
        if (statusFilter !== "ALL" && asset.status !== statusFilter) {
          return false;
        }
        return true;
      }),
    [assets, categoryFilter, statusFilter]
  );

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setFieldErrors((prev) => ({ ...prev, file: undefined }));
    setSuccessMessage("");
  };

  const handleUploadSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    setSuccessMessage("");
    setFieldErrors({});

    setUploading(true);
    const result = await uploadMediaAsset(
      { label, category, file: selectedFile },
      client
    );
    setUploading(false);

    if (result.error) {
      setFieldErrors(result.fieldErrors || {});
      setFormError(result.error);
      return;
    }

    setAssets((prev) => [result.data, ...prev]);
    setLabel("");
    setCategory("logo");
    setSelectedFile(null);
    setSuccessMessage(`Uploaded media asset "${result.data.label}".`);
  };

  const handleApplyLogo = async (asset) => {
    setFormError("");
    setSuccessMessage("");
    setApplyingLogoId(asset.id);
    const result = await applyAssetAsBrandLogo(asset, client);
    setApplyingLogoId(null);

    if (result.error) {
      setFormError(result.error);
      return;
    }

    setSuccessMessage(`Applied "${asset.label}" as the active Brand Logo.`);
  };

  const handleConfirmArchive = async () => {
    if (!archiveTarget) return;
    setArchiving(true);
    setFormError("");
    setSuccessMessage("");

    const result = await archiveMediaAsset(archiveTarget.id, client);
    setArchiving(false);

    if (result.error) {
      setFormError(result.error);
      setArchiveTarget(null);
      return;
    }

    const updated = result.data;
    setAssets((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
    setSuccessMessage(`Archived media asset "${updated.label}".`);
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
        <CircularProgress color="primary" aria-label="Loading media library" />
        <Typography variant="body1" color="text.secondary">
          Loading media library...
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
              Media Library &amp; Brand Assets
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
              to="/admin/settings"
              variant="text"
              size="small"
            >
              Brand Settings
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
          {/* Upload Asset Form */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Card
              sx={{
                borderTop: "4px solid",
                borderColor: "primary.main",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography
                  variant="h5"
                  component="h1"
                  fontWeight="bold"
                  gutterBottom
                >
                  Upload New Asset
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Allowed formats: PNG, JPEG, WebP (maximum 2 MB). SVG and
                  active scripts are blocked for security.
                </Typography>

                <Box component="form" noValidate onSubmit={handleUploadSubmit}>
                  <TextField
                    id="media-label"
                    label="Asset Label"
                    fullWidth
                    required
                    margin="normal"
                    value={label}
                    onChange={(e) => {
                      setLabel(e.target.value);
                      setSuccessMessage("");
                    }}
                    error={Boolean(fieldErrors.label)}
                    helperText={fieldErrors.label}
                    disabled={uploading}
                  />

                  <TextField
                    id="media-category"
                    select
                    label="Asset Category"
                    fullWidth
                    margin="normal"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    error={Boolean(fieldErrors.category)}
                    helperText={fieldErrors.category}
                    disabled={uploading}
                  >
                    {MEDIA_CATEGORIES.map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        {formatCategoryLabel(cat)}
                      </MenuItem>
                    ))}
                  </TextField>

                  <Box sx={{ mt: 2, mb: 1 }}>
                    <Typography
                      component="label"
                      htmlFor="media-file-input"
                      variant="body2"
                      fontWeight="bold"
                      display="block"
                      sx={{ mb: 1 }}
                    >
                      Image File (PNG, JPEG, WebP up to 2 MB) *
                    </Typography>
                    <input
                      id="media-file-input"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleFileChange}
                      disabled={uploading}
                    />
                    {selectedFile && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        sx={{ mt: 1 }}
                      >
                        Selected: {selectedFile.name} (
                        {formatFileSize(selectedFile.size)})
                      </Typography>
                    )}
                    {fieldErrors.file && (
                      <Typography
                        variant="caption"
                        color="error"
                        role="alert"
                        display="block"
                        sx={{ mt: 1 }}
                      >
                        {fieldErrors.file}
                      </Typography>
                    )}
                  </Box>

                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    disabled={uploading}
                    sx={{ mt: 3 }}
                  >
                    {uploading ? "Uploading Asset..." : "Upload Asset"}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Media Library Grid */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="h6" component="h2" gutterBottom>
                  Filter Assets ({filteredAssets.length} of {assets.length})
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      id="filter-media-category"
                      select
                      label="Category Filter"
                      fullWidth
                      size="small"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      <MenuItem value="ALL">All Categories</MenuItem>
                      {MEDIA_CATEGORIES.map((cat) => (
                        <MenuItem key={cat} value={cat}>
                          {formatCategoryLabel(cat)}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      id="filter-media-status"
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

            {filteredAssets.length === 0 ? (
              <Card>
                <CardContent sx={{ textAlign: "center", py: 6 }}>
                  <Typography variant="h6" gutterBottom>
                    No media assets match the current filters.
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Upload a raster logo or poster motif using the form.
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Grid container spacing={2}>
                {filteredAssets.map((asset) => (
                  <Grid size={{ xs: 12, sm: 6 }} key={asset.id}>
                    <Card
                      sx={{
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        borderTop: "4px solid",
                        borderColor:
                          asset.status === "active"
                            ? "primary.main"
                            : "grey.400",
                      }}
                    >
                      <Box
                        sx={{
                          height: 140,
                          bgcolor: "#f5f5f5",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          p: 2,
                        }}
                      >
                        <img
                          src={asset.public_url}
                          alt={asset.label}
                          crossOrigin="anonymous"
                          style={{
                            maxHeight: "100%",
                            maxWidth: "100%",
                            objectFit: "contain",
                          }}
                        />
                      </Box>
                      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                        <Typography
                          variant="subtitle1"
                          component="h3"
                          fontWeight="bold"
                        >
                          {asset.label}
                        </Typography>
                        <Box display="flex" gap={1} flexWrap="wrap" my={1}>
                          <Chip
                            label={formatCategoryLabel(asset.category)}
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            label={
                              asset.status === "active"
                                ? "Status: Active"
                                : "Status: Archived"
                            }
                            color={
                              asset.status === "active" ? "success" : "warning"
                            }
                            size="small"
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {asset.mime_type} &bull;{" "}
                          {formatFileSize(asset.size_bytes)}
                        </Typography>
                      </CardContent>
                      <CardActions sx={{ px: 2, pb: 2, flexWrap: "wrap" }}>
                        {asset.status === "active" && (
                          <>
                            <Button
                              type="button"
                              size="small"
                              variant="outlined"
                              disabled={applyingLogoId === asset.id}
                              onClick={() => handleApplyLogo(asset)}
                            >
                              Use as Brand Logo
                            </Button>
                            <Button
                              type="button"
                              size="small"
                              color="warning"
                              onClick={() => setArchiveTarget(asset)}
                            >
                              Archive {asset.label}
                            </Button>
                          </>
                        )}
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Grid>
        </Grid>
      </Container>

      {/* Archive Confirmation Dialog */}
      <Dialog
        open={Boolean(archiveTarget)}
        onClose={() => !archiving && setArchiveTarget(null)}
        aria-labelledby="archive-media-dialog-title"
      >
        <DialogTitle id="archive-media-dialog-title">
          Archive Media Asset?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Archiving <strong>{archiveTarget?.label}</strong> hides it from
            active asset pickers while keeping the underlying image file intact
            so existing poster snapshots never break.
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


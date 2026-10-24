import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import { fetchAdminMediaAssets } from "../../services/mediaService";

const BUILTIN_MEDIA_ICONS = [
  {
    id: "builtin-logo",
    label: "Aspen Glow Brand Emblem",
    category: "icon",
    public_url: "/logo.png",
  },
  {
    id: "builtin-ag-monogram",
    label: "AG Gold Monogram Icon",
    category: "icon",
    public_url: "/poster-assets/ag-logo-box.png",
  },
  {
    id: "builtin-gift-thali",
    label: "Festive Gift & Puja Thali Motif",
    category: "poster_motif",
    public_url: "/poster-assets/festive-gift-thali.png",
  },
  {
    id: "builtin-ornaments",
    label: "Festive Hanging Ornaments Motif",
    category: "poster_motif",
    public_url: "/poster-assets/hanging-ornaments.png",
  },
];

export default function MediaLibraryIconPicker({
  id = "custom-icon-url",
  label = "Custom Icon from Media Library (optional)",
  value = "",
  onChange,
  error = false,
  helperText = "",
  disabled = false,
  client = null,
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState([]);

  const handleOpenPicker = async () => {
    setOpen(true);
    setLoading(true);
    const res = await fetchAdminMediaAssets(client);
    const uploadedActive = Array.isArray(res.data)
      ? res.data.filter((a) => a.status !== "archived" && a.public_url)
      : [];
    setAssets([...uploadedActive, ...BUILTIN_MEDIA_ICONS]);
    setLoading(false);
  };

  const handleSelectAsset = (publicUrl) => {
    if (typeof onChange === "function") {
      onChange(publicUrl);
    }
    setOpen(false);
  };

  return (
    <Box sx={{ mt: 1.5 }}>
      <Box display="flex" gap={1} alignItems="flex-start" flexWrap="wrap">
        <Box sx={{ flexGrow: 1, minWidth: 200 }}>
          <TextField
            id={id}
            label={label}
            fullWidth
            size="small"
            placeholder="Select from Media Library or paste image URL"
            value={value || ""}
            onChange={(e) => onChange && onChange(e.target.value)}
            error={error}
            helperText={
              helperText ||
              "Optional: overrides the standard icon with an image from Media Library."
            }
            disabled={disabled}
          />
        </Box>
        <Button
          type="button"
          variant="outlined"
          size="small"
          onClick={handleOpenPicker}
          disabled={disabled}
          sx={{ mt: 0.25 }}
        >
          Choose from Media Library
        </Button>
        {value && (
          <Button
            type="button"
            variant="text"
            color="warning"
            size="small"
            onClick={() => onChange && onChange("")}
            disabled={disabled}
            sx={{ mt: 0.25 }}
          >
            Clear Icon
          </Button>
        )}
      </Box>

      {value && (
        <Box
          display="flex"
          alignItems="center"
          gap={1.5}
          sx={{
            mt: 1,
            p: 1,
            borderRadius: 1,
            bgcolor: "background.default",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box
            component="img"
            src={value}
            alt="Selected custom icon preview"
            sx={{
              width: 36,
              height: 36,
              objectFit: "contain",
              borderRadius: "50%",
              bgcolor: "#fce4ec",
              p: 0.5,
            }}
          />
          <Typography variant="caption" color="text.secondary" noWrap>
            Active Custom Icon: {value}
          </Typography>
        </Box>
      )}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        aria-labelledby={`${id}-dialog-title`}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id={`${id}-dialog-title`}>
          Select Icon from Media Library
        </DialogTitle>
        <DialogContent dividers>
          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <Grid container spacing={2}>
              {assets.map((asset) => (
                <Grid size={{ xs: 12, sm: 6 }} key={asset.id || asset.public_url}>
                  <Card variant="outlined" sx={{ height: "100%" }}>
                    <CardContent sx={{ pb: 1, display: "flex", gap: 1.5, alignItems: "center" }}>
                      <Box
                        component="img"
                        src={asset.public_url}
                        alt={asset.label}
                        sx={{
                          width: 48,
                          height: 48,
                          objectFit: "contain",
                          borderRadius: 1,
                          bgcolor: "#1a0709",
                          p: 0.5,
                          border: "1px solid #d4af63",
                        }}
                      />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" fontWeight="bold" noWrap>
                          {asset.label}
                        </Typography>
                        <Chip
                          label={asset.category || "icon"}
                          size="small"
                          variant="outlined"
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    </CardContent>
                    <CardActions sx={{ px: 2, pb: 1.5 }}>
                      <Button
                        type="button"
                        size="small"
                        variant="contained"
                        onClick={() => handleSelectAsset(asset.public_url)}
                      >
                        Select {asset.label}
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button type="button" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


import React, { useState } from "react";
import {
  Box,
  Button,
  Chip,
  Collapse,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";

export const CAMPAIGN_FONT_FAMILIES = [
  { value: "Playfair Display", label: "Playfair Display (Royal Serif)" },
  { value: "Lato", label: "Lato (Clean Sans)" },
  { value: "Georgia", label: "Georgia (Classic Serif)" },
  { value: "Cinzel", label: "Cinzel (Monumental Display)" },
  { value: "Cormorant Garamond", label: "Cormorant Garamond (Luxury Italic)" },
  { value: "Montserrat", label: "Montserrat (Modern Sans)" },
];

export const CAMPAIGN_COLOR_SWATCHES = [
  { hex: "#e05368", label: "Royal Rose" },
  { hex: "#f1cf85", label: "Champagne Gold" },
  { hex: "#fff8f2", label: "Warm Ivory" },
  { hex: "#d4af63", label: "Antique Gold" },
  { hex: "#240a07", label: "Ribbon Espresso" },
  { hex: "#f5a97f", label: "Peach Gold" },
  { hex: "#ffffff", label: "Pure White" },
];

export const DEFAULT_CAMPAIGN_TEXT_STYLES = {
  headline: {
    fontFamily: "Playfair Display",
    fontSize: 0, // 0 = Smart Auto-Fit
    color: "",
    fontWeight: "bold",
    fontStyle: "italic",
    textTransform: "none",
    textAlign: "center",
  },
  subheadline: {
    fontFamily: "Playfair Display",
    fontSize: 0,
    color: "",
    fontWeight: "bold",
    fontStyle: "italic",
    textTransform: "none",
    textAlign: "center",
  },
  secondarySubheadline: {
    fontFamily: "Playfair Display",
    fontSize: 0,
    color: "",
    fontWeight: "normal",
    fontStyle: "normal",
    textTransform: "none",
    textAlign: "center",
  },
  sectionTitle: {
    fontFamily: "Playfair Display",
    fontSize: 0,
    color: "",
    fontWeight: "bold",
    fontStyle: "normal",
    textTransform: "none",
    textAlign: "center",
  },
  sectionSubtitle: {
    fontFamily: "Playfair Display",
    fontSize: 0,
    color: "",
    fontWeight: "normal",
    fontStyle: "italic",
    textTransform: "none",
    textAlign: "center",
  },
  badgeText: {
    fontFamily: "Playfair Display",
    fontSize: 0,
    color: "",
    fontWeight: "bold",
    fontStyle: "normal",
    textTransform: "none",
    textAlign: "center",
  },
  ctaText: {
    fontFamily: "Playfair Display",
    fontSize: 0,
    color: "",
    fontWeight: "bold",
    fontStyle: "normal",
    textTransform: "none",
    textAlign: "center",
  },
  footerTagline: {
    fontFamily: "Playfair Display",
    fontSize: 0,
    color: "",
    fontWeight: "bold",
    fontStyle: "normal",
    textTransform: "none",
    textAlign: "center",
  },
  validityNote: {
    fontFamily: "Lato",
    fontSize: 0,
    color: "",
    fontWeight: "bold",
    fontStyle: "normal",
    textTransform: "none",
    textAlign: "center",
  },
};

export default function RichTextCampaignField({
  id,
  fieldKey,
  label,
  value,
  onChange,
  styleValue = {},
  onStyleChange,
  defaultOpenToolbar = false,
  multiline = false,
  minRows = 1,
  required = false,
  placeholder = "",
  error = false,
  helperText = "",
  size = "small",
}) {
  const [toolbarOpen, setToolbarOpen] = useState(defaultOpenToolbar);

  const defaultStyle = DEFAULT_CAMPAIGN_TEXT_STYLES[fieldKey] || {
    fontFamily: "Playfair Display",
    fontSize: 0,
    color: "",
    fontWeight: "bold",
    fontStyle: "normal",
    textTransform: "none",
    textAlign: "center",
  };

  const mergedStyle = {
    ...defaultStyle,
    ...(styleValue || {}),
  };

  const updateStyleProp = (prop, nextVal) => {
    if (typeof onStyleChange === "function") {
      const nextStyleObj = {
        ...mergedStyle,
        [prop]: nextVal,
      };
      onStyleChange(nextStyleObj, fieldKey);
    }
  };

  const handleResetFieldStyle = () => {
    if (typeof onStyleChange === "function") {
      onStyleChange({ ...defaultStyle }, fieldKey);
    }
  };

  const hasCustomOverride =
    Boolean(mergedStyle.color) ||
    Number(mergedStyle.fontSize) > 0 ||
    mergedStyle.fontFamily !== defaultStyle.fontFamily ||
    mergedStyle.fontWeight !== defaultStyle.fontWeight ||
    mergedStyle.fontStyle !== defaultStyle.fontStyle ||
    mergedStyle.textTransform !== defaultStyle.textTransform;

  return (
    <Box sx={{ my: 1 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={0.25}
      >
        <Box display="flex" alignItems="center" gap={0.75}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            {label}
          </Typography>
          {hasCustomOverride && (
            <Chip
              label="Custom Style"
              size="small"
              color="secondary"
              sx={{ height: 18, fontSize: "0.65rem" }}
            />
          )}
        </Box>
        <Button
          type="button"
          size="small"
          variant="text"
          onClick={() => setToolbarOpen((prev) => !prev)}
          aria-label={`Customize typography for ${label}`}
          sx={{ py: 0, minHeight: 22, fontSize: "0.72rem" }}
        >
          {toolbarOpen ? "Hide Rich Text Toolbar" : "Aa Rich Text & Font Style"}
        </Button>
      </Box>

      <Collapse in={toolbarOpen}>
        <Box
          data-testid={`rich-toolbar-${fieldKey}`}
          sx={{
            p: 1.25,
            mb: 1,
            borderRadius: 1,
            bgcolor: "rgba(212, 175, 99, 0.08)",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={1}
          >
            <Typography variant="caption" fontWeight="bold" color="primary.main">
              Tiptap Typography &amp; Style Controls
            </Typography>
            <Button
              type="button"
              size="small"
              variant="text"
              onClick={handleResetFieldStyle}
              sx={{ py: 0, minHeight: 20, fontSize: "0.7rem" }}
            >
              Reset Field Style
            </Button>
          </Box>

          <Grid container spacing={1} alignItems="center">
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                id={`${id}-font-family`}
                select
                label="Font Family"
                fullWidth
                size="small"
                value={mergedStyle.fontFamily || "Playfair Display"}
                onChange={(e) => updateStyleProp("fontFamily", e.target.value)}
              >
                {CAMPAIGN_FONT_FAMILIES.map((f) => (
                  <MenuItem key={f.value} value={f.value}>
                    {f.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                id={`${id}-font-size`}
                select
                label="Font Size (px)"
                fullWidth
                size="small"
                value={Number(mergedStyle.fontSize) || 0}
                onChange={(e) =>
                  updateStyleProp("fontSize", Number(e.target.value) || 0)
                }
              >
                <MenuItem value={0}>Auto-Fit to Frame (Recommended)</MenuItem>
                {[16, 18, 20, 22, 24, 28, 32, 36, 42, 48, 54, 60, 68, 76, 86].map(
                  (sz) => (
                    <MenuItem key={sz} value={sz}>
                      {sz} px
                    </MenuItem>
                  )
                )}
              </TextField>
            </Grid>
          </Grid>

          <Box
            display="flex"
            flexWrap="wrap"
            alignItems="center"
            gap={0.75}
            mt={1}
          >
            <Button
              type="button"
              size="small"
              variant={
                mergedStyle.fontWeight === "bold" ? "contained" : "outlined"
              }
              onClick={() =>
                updateStyleProp(
                  "fontWeight",
                  mergedStyle.fontWeight === "bold" ? "normal" : "bold"
                )
              }
              sx={{ minWidth: 36, px: 1, fontWeight: "bold" }}
            >
              B
            </Button>
            <Button
              type="button"
              size="small"
              variant={
                mergedStyle.fontStyle === "italic" ? "contained" : "outlined"
              }
              onClick={() =>
                updateStyleProp(
                  "fontStyle",
                  mergedStyle.fontStyle === "italic" ? "normal" : "italic"
                )
              }
              sx={{ minWidth: 36, px: 1, fontStyle: "italic" }}
            >
              I
            </Button>
            <Button
              type="button"
              size="small"
              variant={
                mergedStyle.textTransform === "uppercase"
                  ? "contained"
                  : "outlined"
              }
              onClick={() =>
                updateStyleProp(
                  "textTransform",
                  mergedStyle.textTransform === "uppercase"
                    ? "none"
                    : "uppercase"
                )
              }
              sx={{ minWidth: 44, px: 1 }}
            >
              AA
            </Button>

            <Box
              display="flex"
              alignItems="center"
              flexWrap="wrap"
              gap={0.5}
              sx={{ ml: 0.5 }}
            >
              <Typography variant="caption" color="text.secondary">
                Color:
              </Typography>
              {CAMPAIGN_COLOR_SWATCHES.map((sw) => (
                <Box
                  key={sw.hex}
                  component="button"
                  type="button"
                  title={`${sw.label} (${sw.hex})`}
                  aria-label={`Set ${label} color to ${sw.label}`}
                  onClick={() => updateStyleProp("color", sw.hex)}
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    bgcolor: sw.hex,
                    border:
                      mergedStyle.color === sw.hex
                        ? "2px solid #1976d2"
                        : "1px solid rgba(0,0,0,0.35)",
                    cursor: "pointer",
                    p: 0,
                  }}
                />
              ))}
              <TextField
                id={`${id}-color-hex`}
                label="Hex Color"
                size="small"
                placeholder="#f1cf85"
                value={mergedStyle.color || ""}
                onChange={(e) => updateStyleProp("color", e.target.value)}
                sx={{ width: 108, ml: 0.5 }}
              />
            </Box>
          </Box>
        </Box>
      </Collapse>

      <TextField
        id={id}
        label={label}
        fullWidth
        required={required}
        multiline={multiline}
        minRows={minRows}
        size={size}
        margin="dense"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          if (typeof onChange === "function") {
            onChange(typeof e === "string" ? e : e.target.value, e);
          }
        }}
        error={error}
        helperText={helperText}
        slotProps={{
          htmlInput: {
            style: {
              fontFamily: `'${mergedStyle.fontFamily || "Playfair Display"}', serif`,
              fontWeight: mergedStyle.fontWeight || "normal",
              fontStyle: mergedStyle.fontStyle || "normal",
              textTransform: mergedStyle.textTransform || "none",
              ...(mergedStyle.color ? { color: mergedStyle.color } : {}),
            },
          },
        }}
      />
    </Box>
  );
}


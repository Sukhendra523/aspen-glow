import { createTheme } from "@mui/material";
import {
  APPROVED_BODY_FONTS,
  APPROVED_HEADING_FONTS,
  DEFAULT_BRAND_SETTINGS,
  isValidHexColor,
} from "./defaultSettings";

export function buildSalonTheme(brand = DEFAULT_BRAND_SETTINGS) {
  const safeBrand = { ...DEFAULT_BRAND_SETTINGS, ...(brand || {}) };

  const primaryMain = isValidHexColor(safeBrand.primary_color)
    ? safeBrand.primary_color.trim()
    : DEFAULT_BRAND_SETTINGS.primary_color;
  const secondaryMain = isValidHexColor(safeBrand.secondary_color)
    ? safeBrand.secondary_color.trim()
    : DEFAULT_BRAND_SETTINGS.secondary_color;
  const bgDefault = isValidHexColor(safeBrand.background_color)
    ? safeBrand.background_color.trim()
    : DEFAULT_BRAND_SETTINGS.background_color;

  const headingFont = APPROVED_HEADING_FONTS.includes(safeBrand.heading_font)
    ? safeBrand.heading_font
    : DEFAULT_BRAND_SETTINGS.heading_font;
  const bodyFont = APPROVED_BODY_FONTS.includes(safeBrand.body_font)
    ? safeBrand.body_font
    : DEFAULT_BRAND_SETTINGS.body_font;

  const headingFamily = `'${headingFont}', 'Georgia', serif`;
  const bodyFamily = `'${bodyFont}', 'Helvetica', 'Arial', sans-serif`;

  return createTheme({
    palette: {
      primary: {
        main: primaryMain,
      },
      secondary: {
        main: secondaryMain,
      },
      background: {
        default: bgDefault,
        paper: "#ffffff",
      },
      text: {
        primary: "#333333",
        secondary: "#555555",
      },
    },
    typography: {
      fontFamily: bodyFamily,
      h1: {
        fontFamily: headingFamily,
        fontWeight: 700,
      },
      h2: {
        fontFamily: headingFamily,
        fontWeight: 700,
      },
      h3: {
        fontFamily: headingFamily,
        fontWeight: 700,
      },
      h4: {
        fontFamily: headingFamily,
        fontWeight: 400,
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: "50px",
            textTransform: "none",
            padding: "10px 24px",
          },
        },
      },
    },
  });
}

const theme = buildSalonTheme(DEFAULT_BRAND_SETTINGS);

export default theme;

export const POSTER_FORMATS = {
  square_1080: {
    key: "square_1080",
    label: "Instagram Square (1080 × 1080)",
    width: 1080,
    height: 1080,
  },
  portrait_1080x1350: {
    key: "portrait_1080x1350",
    label: "Portrait / Status (1080 × 1350)",
    width: 1080,
    height: 1350,
  },
};

export const POSTER_THEMES = {
  royal_rose: {
    key: "royal_rose",
    label: "Royal Rose & Cream",
    background: "#FEFBF6",
    cardBackground: "#FFFFFF",
    primary: "#d81b60",
    secondary: "#880e4f",
    accent: "#c2185b",
    textPrimary: "#2b1b22",
    textSecondary: "#5c434d",
  },
  festive_gold: {
    key: "festive_gold",
    label: "Festive Marigold & Ivory",
    background: "#FFFDF7",
    cardBackground: "#FFFFFF",
    primary: "#9c274c",
    secondary: "#5d1029",
    accent: "#b26a00",
    textPrimary: "#2c1e14",
    textSecondary: "#5e493a",
  },
  emerald_celebration: {
    key: "emerald_celebration",
    label: "Teej Emerald & Pearl",
    background: "#F7FBF8",
    cardBackground: "#FFFFFF",
    primary: "#1b5e20",
    secondary: "#ad1457",
    accent: "#2e7d32",
    textPrimary: "#1b2e1e",
    textSecondary: "#455a48",
  },
};

export const DEFAULT_FESTIVALS = [
  {
    id: "fest-karwa-chauth",
    name: "Karwa Chauth",
    category: "Indian Festival",
    default_headline: "Karwa Chauth Special Glow Packages",
    default_subheadline:
      "Celebrate with radiant skin, bridal mehndi, and festive styling.",
    motif_label: "🌙 ✨ Karwa Chauth Special",
    accent_color: "#c2185b",
    active: true,
    display_order: 1,
  },
  {
    id: "fest-diwali",
    name: "Diwali",
    category: "Indian Festival",
    default_headline: "Diwali Festive Beauty Offers",
    default_subheadline:
      "Shine bright this festival of lights with our curated beauty packages.",
    motif_label: "🪔 ✨ शुभ दीपावली • Festive Glow",
    accent_color: "#b26a00",
    active: true,
    display_order: 2,
  },
  {
    id: "fest-teej",
    name: "Teej",
    category: "Indian Festival",
    default_headline: "Hariyali & Hartalika Teej Specials",
    default_subheadline:
      "Traditional mehndi, facial glow, and festive makeup packages.",
    motif_label: "🌸 🌿 Teej Celebration",
    accent_color: "#2e7d32",
    active: true,
    display_order: 3,
  },
  {
    id: "fest-navratri",
    name: "Navratri & Durga Puja",
    category: "Indian Festival",
    default_headline: "Navratri & Garba Glam Packages",
    default_subheadline:
      "Nine nights of festive beauty, hairstyling, and radiant skin care.",
    motif_label: "🔱 ✨ Navratri Festive Glam",
    accent_color: "#ad1457",
    active: true,
    display_order: 4,
  },
  {
    id: "fest-bridal",
    name: "Wedding & Bridal Season",
    category: "Bridal & Occasion",
    default_headline: "Bridal & Pre-Bridal Luxury Packages",
    default_subheadline:
      "Complete Haldi, Mehndi, Engagement, and HD Bridal beauty care.",
    motif_label: "👰 👑 Bridal Season Special",
    accent_color: "#880e4f",
    active: true,
    display_order: 5,
  },
];

export const DEFAULT_POSTER_TEMPLATES = [
  {
    id: "tpl-grid-1",
    template_key: "festive_grid_v1",
    name: "Royal Festive Grid",
    version: 1,
    supported_formats: ["square_1080", "portrait_1080x1350"],
    layout_config: {
      max_offerings: 4,
      columns: 2,
      style: "grid",
      show_border: true,
    },
    active: true,
  },
  {
    id: "tpl-spotlight-1",
    template_key: "bridal_spotlight_v1",
    name: "Spotlight Offer Card",
    version: 1,
    supported_formats: ["square_1080", "portrait_1080x1350"],
    layout_config: {
      max_offerings: 2,
      columns: 1,
      style: "spotlight",
      show_border: true,
    },
    active: true,
  },
  {
    id: "tpl-minimal-1",
    template_key: "minimal_elegance_v1",
    name: "Minimal Salon Elegance",
    version: 1,
    supported_formats: ["square_1080", "portrait_1080x1350"],
    layout_config: {
      max_offerings: 4,
      columns: 1,
      style: "list",
      show_border: false,
    },
    active: true,
  },
];


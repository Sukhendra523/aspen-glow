import {
  DEFAULT_BRAND_SETTINGS,
  DEFAULT_CONTACT_SETTINGS,
} from "../constants/defaultSettings";
import { formatInrPrice } from "../constants/serviceCatalogue";
import {
  DEFAULT_FESTIVALS,
  DEFAULT_POSTER_TEMPLATES,
  POSTER_FORMATS,
  POSTER_THEMES,
} from "./posterTemplates";

export function validatePosterCampaignInput(input = {}) {
  const errors = {};
  const campaignName = (input.campaignName || "").trim();
  const headline = (input.headline || "").trim();
  const subheadline = (input.subheadline || "").trim();
  const validityNote = (input.validityNote || "").trim();
  const formatKey = (input.formatKey || "square_1080").trim();
  const themeKey = (input.themeKey || "royal_rose").trim();
  const templateKey = (input.template?.template_key || input.templateKey || "").trim();

  if (!campaignName) {
    errors.campaignName = "Campaign name is required.";
  } else if (campaignName.length > 120) {
    errors.campaignName = "Campaign name must be 120 characters or fewer.";
  }

  if (!headline) {
    errors.headline = "Poster headline is required.";
  } else if (headline.length > 120) {
    errors.headline = "Headline must be 120 characters or fewer.";
  }

  if (subheadline.length > 200) {
    errors.subheadline = "Subheadline must be 200 characters or fewer.";
  }

  if (validityNote.length > 120) {
    errors.validityNote = "Validity note must be 120 characters or fewer.";
  }

  if (!POSTER_FORMATS[formatKey]) {
    errors.formatKey = "Select a supported poster format.";
  }

  if (!POSTER_THEMES[themeKey]) {
    errors.themeKey = "Select a supported poster theme.";
  }

  if (!templateKey) {
    errors.templateKey = "Select a poster template.";
  }

  const selectedPackages = Array.isArray(input.selectedPackages)
    ? input.selectedPackages
    : [];
  const selectedBundles = Array.isArray(input.selectedBundles)
    ? input.selectedBundles
    : [];
  const totalOfferings = selectedPackages.length + selectedBundles.length;

  const maxOfferings = Number(input.template?.layout_config?.max_offerings) || 4;

  if (totalOfferings === 0) {
    errors.offerings =
      "Select at least one package or bundle to feature on the poster.";
  } else if (totalOfferings > maxOfferings) {
    errors.offerings = `This template supports at most ${maxOfferings} featured offerings.`;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function buildPosterSnapshot({
  campaignName = "",
  headline = "",
  subheadline = "",
  validityNote = "",
  festival = DEFAULT_FESTIVALS[0],
  template = DEFAULT_POSTER_TEMPLATES[0],
  formatKey = "square_1080",
  themeKey = "royal_rose",
  brand = DEFAULT_BRAND_SETTINGS,
  contact = DEFAULT_CONTACT_SETTINGS,
  selectedPackages = [],
  selectedBundles = [],
  capturedAt = new Date().toISOString(),
} = {}) {
  const safeFormat = POSTER_FORMATS[formatKey] || POSTER_FORMATS.square_1080;
  const safeTheme = POSTER_THEMES[themeKey] || POSTER_THEMES.royal_rose;
  const safeFestival = festival || DEFAULT_FESTIVALS[0];
  const safeTemplate = template || DEFAULT_POSTER_TEMPLATES[0];
  const safeBrand = { ...DEFAULT_BRAND_SETTINGS, ...(brand || {}) };
  const safeContact = { ...DEFAULT_CONTACT_SETTINGS, ...(contact || {}) };

  const packageOfferings = (Array.isArray(selectedPackages)
    ? selectedPackages
    : []
  ).map((pkg) => {
    const priceInr = Number(pkg.price_inr) || 0;
    const rawItems = Array.isArray(pkg.items)
      ? pkg.items
      : Array.isArray(pkg.package_services)
      ? pkg.package_services
          .map((ps) => {
            const name = ps.service?.name || ps.service_name || "";
            const note = ps.inclusion_note || "";
            return `${name} ${note}`.trim();
          })
          .filter(Boolean)
      : [];
    return {
      id: String(pkg.id || pkg.name || ""),
      kind: "package",
      name: String(pkg.name || "").trim(),
      description: String(pkg.description || "").trim(),
      price_inr: priceInr,
      price_formatted: formatInrPrice(priceInr),
      items: rawItems.map((line) => String(line)),
    };
  });

  const bundleOfferings = (Array.isArray(selectedBundles)
    ? selectedBundles
    : []
  ).map((bundle) => {
    const priceInr = Number(bundle.price_inr) || 0;
    const rawItems = Array.isArray(bundle.items)
      ? bundle.items.map((pkgName) => `Includes: ${pkgName}`)
      : Array.isArray(bundle.bundle_packages)
      ? bundle.bundle_packages
          .map((bp) => {
            const name = bp.package?.name || bp.package_name || "";
            return name ? `Includes: ${name}` : "";
          })
          .filter(Boolean)
      : [];
    return {
      id: String(bundle.id || bundle.name || ""),
      kind: "bundle",
      name: String(bundle.name || "").trim(),
      description: String(bundle.description || "").trim(),
      price_inr: priceInr,
      price_formatted: formatInrPrice(priceInr),
      items: rawItems.map((line) => String(line)),
    };
  });

  const maxOfferings =
    Number(safeTemplate.layout_config?.max_offerings) || 4;
  const offerings = [...packageOfferings, ...bundleOfferings].slice(
    0,
    maxOfferings
  );

  // Return a deep-cloned, immutable structure
  return JSON.parse(
    JSON.stringify({
      snapshot_version: 1,
      captured_at: capturedAt,
      campaign: {
        campaign_name: String(campaignName || "").trim(),
        headline: String(
          headline || safeFestival.default_headline || ""
        ).trim(),
        subheadline: String(
          subheadline !== undefined
            ? subheadline
            : safeFestival.default_subheadline || ""
        ).trim(),
        validity_note: String(validityNote || "").trim(),
      },
      festival: {
        id: safeFestival.id || null,
        name: String(safeFestival.name || ""),
        category: String(safeFestival.category || "Indian Festival"),
        motif_label: String(safeFestival.motif_label || "✨"),
        accent_color: String(safeFestival.accent_color || safeTheme.accent),
      },
      template: {
        template_key: String(safeTemplate.template_key || "festive_grid_v1"),
        name: String(safeTemplate.name || "Royal Festive Grid"),
        version: Number(safeTemplate.version) || 1,
        format_key: safeFormat.key,
        width: safeFormat.width,
        height: safeFormat.height,
        theme_key: safeTheme.key,
        theme: safeTheme,
        layout_config: safeTemplate.layout_config || {
          max_offerings: 4,
          columns: 2,
          style: "grid",
          show_border: true,
        },
      },
      brand: {
        brand_name: String(safeBrand.brand_name),
        short_name: String(safeBrand.short_name),
        tagline: String(safeBrand.tagline || ""),
        logo_url: String(safeBrand.logo_url || ""),
        primary_color: String(safeBrand.primary_color || safeTheme.primary),
        secondary_color: String(
          safeBrand.secondary_color || safeTheme.secondary
        ),
        background_color: String(
          safeBrand.background_color || safeTheme.background
        ),
        heading_font: String(safeBrand.heading_font || "Playfair Display"),
        body_font: String(safeBrand.body_font || "Lato"),
      },
      contact: {
        contact_name: String(safeContact.contact_name),
        phone: String(safeContact.phone),
        whatsapp: String(safeContact.whatsapp),
        address: String(safeContact.address),
      },
      offerings,
    })
  );
}


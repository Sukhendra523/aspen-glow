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

const DEFAULT_CATALOGUE_SECTIONS = {
  makeupAndBridalCards: [
    {
      name: "Light Party Makeup",
      price_inr: 1499,
      price_formatted: "₹1,499",
      icon_type: "makeup_brush",
      items: [
        "Includes: Professional Makeup, Elegant Hairstyle & Saree Draping.",
      ],
    },
    {
      name: "Glamour Pro Makeup",
      price_inr: 1999,
      price_formatted: "₹1,999",
      icon_type: "glamour_lady",
      items: [
        "Includes: Full Party Makeup, Hairstyle & Saree/Lehenga Draping.",
      ],
    },
    {
      name: "Engagement Makeup",
      price_inr: 2999,
      price_formatted: "₹2,999",
      icon_type: "diamond_ring",
      items: ["Includes: Makeup, Hairstyling & Lehnga Draping."],
    },
    {
      name: "HD Bridal Makeup",
      price_inr: 14999,
      price_formatted: "₹14,999",
      icon_type: "bride_veil",
      items: [
        "Includes: Complete HD Bridal Makeup, Hairstyling, a complimentary Light Cleanup session, and perfect Lehnga Draping.",
      ],
    },
  ],
  bridalSpotlight: {
    name: "Haldi / Mehndi Makeup",
    price_inr: 2499,
    price_formatted: "₹2,499",
    icon_type: "mehndi_hand",
    items: [
      "A radiant look for your pre-wedding ceremonies.",
      "Includes: Makeup, Hairstyling & Lehnga/Saree Draping.",
    ],
  },
  haircuts: [
    { name: "Step Cut", price_inr: 350, price_formatted: "₹350" },
    { name: "Layer Cut", price_inr: 250, price_formatted: "₹250" },
    { name: "V-Shape Cut", price_inr: 200, price_formatted: "₹200" },
    { name: "U-Shape Cut", price_inr: 150, price_formatted: "₹150" },
    { name: "Baby Cut", price_inr: 100, price_formatted: "₹100" },
  ],
  mehndi: {
    name: "Mehndi Artistry",
    description:
      "Intricate and beautiful Mehndi designs for all occasions.",
    price_inr: 99,
    price_label: "Starting from just",
    price_formatted: "₹99",
  },
};

export function validatePosterCampaignInput(input = {}) {
  const errors = {};
  const campaignName = (input.campaignName || "").trim();
  const headline = (input.headline || "").trim();
  const subheadline = (input.subheadline || "").trim();
  const validityNote = (input.validityNote || "").trim();
  const formatKey = (input.formatKey || "square_1080").trim();
  const themeKey = (input.themeKey || "royal_dark_gold").trim();
  const templateKey = (
    input.template?.template_key ||
    input.templateKey ||
    ""
  ).trim();

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
  const selectedServices = Array.isArray(input.selectedServices)
    ? input.selectedServices
    : [];
  const totalOfferings =
    selectedPackages.length + selectedBundles.length + selectedServices.length;

  const isCatalogueTemplate =
    templateKey === "bridal_alacarte_catalogue_v1" ||
    input.template?.layout_config?.style === "bridal_catalogue";
  const maxOfferings =
    Number(input.template?.layout_config?.max_offerings) || 4;

  if (!isCatalogueTemplate && totalOfferings === 0) {
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

function buildCatalogueSectionsFromServices(services = []) {
  if (!Array.isArray(services) || services.length === 0) {
    return DEFAULT_CATALOGUE_SECTIONS;
  }

  const makeupSvcs = services.filter((s) => s.category === "Makeup & Styling");
  const bridalSvcs = services.filter(
    (s) => s.category === "Bridal & Pre-Bridal"
  );
  const hairSvcs = services.filter((s) => s.category === "Hair Services");
  const mehndiSvc = services.find((s) => s.category === "Mehndi Artistry");

  const haldiSvc =
    bridalSvcs.find((s) => /haldi|mehndi/i.test(s.name)) || null;
  const gridBridalSvcs = bridalSvcs.filter((s) => s !== haldiSvc);
  const combinedGrid = [...makeupSvcs, ...gridBridalSvcs].slice(0, 4);

  const iconTypes = [
    "makeup_brush",
    "glamour_lady",
    "diamond_ring",
    "bride_veil",
  ];
  const makeupAndBridalCards =
    combinedGrid.length > 0
      ? combinedGrid.map((svc, idx) => {
          const priceInr = Number(svc.price_inr) || 0;
          const items =
            Array.isArray(svc.inclusions) && svc.inclusions.length > 0
              ? svc.inclusions
              : svc.description
              ? [svc.description]
              : [];
          return {
            name: String(svc.name || "").trim(),
            price_inr: priceInr,
            price_formatted: formatInrPrice(priceInr),
            icon_type: iconTypes[idx % iconTypes.length],
            items: items.map((line) => String(line)),
          };
        })
      : DEFAULT_CATALOGUE_SECTIONS.makeupAndBridalCards;

  const bridalSpotlight = haldiSvc
    ? {
        name: String(haldiSvc.name || "").trim(),
        price_inr: Number(haldiSvc.price_inr) || 2499,
        price_formatted: formatInrPrice(Number(haldiSvc.price_inr) || 2499),
        icon_type: "mehndi_hand",
        items:
          Array.isArray(haldiSvc.inclusions) && haldiSvc.inclusions.length > 0
            ? haldiSvc.inclusions.map(String)
            : [
                haldiSvc.description ||
                  "A radiant look for your pre-wedding ceremonies.",
              ],
      }
    : DEFAULT_CATALOGUE_SECTIONS.bridalSpotlight;

  const haircuts =
    hairSvcs.length > 0
      ? hairSvcs.map((h) => ({
          name: String(h.name || "").trim(),
          price_inr: Number(h.price_inr) || 0,
          price_formatted: formatInrPrice(Number(h.price_inr) || 0),
        }))
      : DEFAULT_CATALOGUE_SECTIONS.haircuts;

  const mehndi = mehndiSvc
    ? {
        name: String(mehndiSvc.name || "Mehndi Artistry").trim(),
        description: String(
          mehndiSvc.description ||
            "Intricate and beautiful Mehndi designs for all occasions."
        ).trim(),
        price_inr: Number(mehndiSvc.price_inr) || 99,
        price_label: String(
          mehndiSvc.price_label || "Starting from just"
        ).trim(),
        price_formatted: formatInrPrice(Number(mehndiSvc.price_inr) || 99),
      }
    : DEFAULT_CATALOGUE_SECTIONS.mehndi;

  return {
    makeupAndBridalCards,
    bridalSpotlight,
    haircuts,
    mehndi,
  };
}

export function buildPosterSnapshot({
  campaignName = "",
  headline = "",
  subheadline = "",
  secondarySubheadline = "",
  sectionTitle = "",
  sectionSubtitle = "",
  badgeText = "",
  ctaText = "",
  footerTagline = "",
  validityNote = "",
  portraitUrl = "",
  showQrCode = false,
  festival = DEFAULT_FESTIVALS[0],
  template = DEFAULT_POSTER_TEMPLATES[0],
  formatKey = "square_1080",
  themeKey = "royal_rose",
  brand = DEFAULT_BRAND_SETTINGS,
  contact = DEFAULT_CONTACT_SETTINGS,
  selectedPackages = [],
  selectedBundles = [],
  catalogueServices = [],
  capturedAt = new Date().toISOString(),
} = {}) {
  const safeFormat = POSTER_FORMATS[formatKey] || POSTER_FORMATS.square_1080;
  const safeTheme =
    POSTER_THEMES[themeKey] ||
    POSTER_THEMES.royal_dark_gold ||
    POSTER_THEMES.royal_rose;
  const safeFestival = festival || DEFAULT_FESTIVALS[0];
  const safeTemplate = template || DEFAULT_POSTER_TEMPLATES[0];
  const safeBrand = { ...DEFAULT_BRAND_SETTINGS, ...(brand || {}) };
  const safeContact = { ...DEFAULT_CONTACT_SETTINGS, ...(contact || {}) };

  const defaultColumnColors = safeTheme.columnColors || [
    "#4e1014",
    "#261326",
    "#4f3811",
    "#0c3329",
  ];
  const defaultTaglines = [
    "SAVE MORE | LOOK BEAUTIFUL",
    "RADIATE BEAUTY | THIS FESTIVE SEASON",
    "SHINE LIKE | A LOTUS",
    "FEEL ROYAL | BE ROYAL",
  ];

  const packageOfferings = (Array.isArray(selectedPackages)
    ? selectedPackages
    : []
  ).map((pkg, idx) => {
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
      package_group: String(
        pkg.package_group || "Multi-Service Packages"
      ).trim(),
      tagline: String(
        pkg.tagline || defaultTaglines[idx % defaultTaglines.length] || ""
      ).trim(),
      badge_text: String(
        pkg.badge_text !== undefined
          ? pkg.badge_text
          : /lotus glow/i.test(pkg.name || "")
          ? "MOST POPULAR"
          : ""
      ).trim(),
      card_color: String(
        pkg.card_color ||
          defaultColumnColors[idx % defaultColumnColors.length] ||
          "#4e1014"
      ).trim(),
      items: rawItems.map((line) => String(line)),
    };
  });

  const bundleOfferings = (Array.isArray(selectedBundles)
    ? selectedBundles
    : []
  ).map((bundle, idx) => {
    const priceInr = Number(bundle.price_inr) || 0;
    const rawItems = Array.isArray(bundle.items)
      ? bundle.items.map((pkgName) =>
          pkgName.startsWith("Includes:") ? pkgName : `Includes: ${pkgName}`
        )
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
      tagline: String(bundle.tagline || "SPECIAL FESTIVE BUNDLE").trim(),
      badge_text: String(bundle.badge_text || "").trim(),
      card_color: String(
        bundle.card_color ||
          defaultColumnColors[idx % defaultColumnColors.length] ||
          "#4f3811"
      ).trim(),
      items: rawItems.map((line) => String(line)),
    };
  });

  const maxOfferings =
    Number(safeTemplate.layout_config?.max_offerings) || 4;
  const offerings = [...packageOfferings, ...bundleOfferings].slice(
    0,
    maxOfferings
  );

  const catalogueSections = buildCatalogueSectionsFromServices(
    catalogueServices
  );

  const festName = String(safeFestival.name || "Teej").trim();

  // Return a deep-cloned, immutable structure
  return JSON.parse(
    JSON.stringify({
      snapshot_version: 2,
      captured_at: capturedAt,
      campaign: {
        campaign_name: String(campaignName || "").trim(),
        headline: String(
          headline || safeFestival.default_headline || `${festName} Special Offer`
        ).trim(),
        subheadline: String(
          subheadline !== undefined
            ? subheadline
            : safeFestival.default_subheadline ||
              `Unveil your radiant glow for ${festName}`
        ).trim(),
        secondary_subheadline: String(
          secondarySubheadline ||
            "Celebrate the bond of love with Self-Care & Confidence"
        ).trim(),
        section_title: String(
          sectionTitle || "MULTI SERVICE PACKAGES"
        ).trim(),
        section_subtitle: String(
          sectionSubtitle || `Pamper Yourself This ${festName}`
        ).trim(),
        badge_text: String(
          badgeText || "GLOW\nINSIDE & OUT\nBECAUSE\nYOU DESERVE IT!"
        ).trim(),
        cta_text: String(ctaText || "BOOK YOUR APPOINTMENT NOW!").trim(),
        footer_tagline: String(
          footerTagline ||
            `THIS ${festName.toUpperCase()}, GIFT YOUR SISTER THE GLOW SHE DESERVES.`
        ).trim(),
        validity_note: String(validityNote || "").trim(),
        portrait_url: String(portraitUrl || "").trim(),
        show_qr_code: Boolean(showQrCode),
      },
      festival: {
        id: safeFestival.id || null,
        name: festName,
        category: String(safeFestival.category || "Indian Festival"),
        motif_label: String(safeFestival.motif_label || "✨"),
        accent_color: String(safeFestival.accent_color || safeTheme.accent),
      },
      template: {
        template_key: String(
          safeTemplate.template_key || "royal_4col_packages_v1"
        ),
        name: String(
          safeTemplate.name || "Royal 4-Column Multi-Service Packages"
        ),
        version: Number(safeTemplate.version) || 1,
        format_key: safeFormat.key,
        width: safeFormat.width,
        height: safeFormat.height,
        theme_key: safeTheme.key,
        theme: safeTheme,
        layout_config: safeTemplate.layout_config || {
          max_offerings: 4,
          columns: 4,
          style: "royal_4col",
          show_border: true,
        },
      },
      brand: {
        brand_name: String(safeBrand.brand_name),
        short_name: String(safeBrand.short_name),
        tagline: String(safeBrand.tagline || ""),
        logo_url: String(safeBrand.logo_url || "/poster-assets/ag-logo-box.png"),
        website_domain: "aspen-glow.netlify.app",
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
        booking_url: String(
          safeContact.booking_url || "https://aspen-glow.netlify.app"
        ),
      },
      offerings,
      catalogue_sections: catalogueSections,
    })
  );
}

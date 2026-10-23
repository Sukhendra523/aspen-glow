export const SERVICE_CATEGORIES = [
  "Makeup & Styling",
  "Bridal & Pre-Bridal",
  "Hair Services",
  "Mehndi Artistry",
  "Beauty & Skincare",
];

export const SERVICE_ICONS = [
  "AutoAwesome",
  "ColorLens",
  "Star",
  "FaceRetouchingNatural",
  "Cake",
  "ContentCut",
];

export const SERVICE_STATUSES = ["draft", "published", "archived"];

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatInrPrice(priceInr, priceLabel = "") {
  const numeric = Number(priceInr);
  const formatted = Number.isInteger(numeric) && numeric >= 0
    ? inrFormatter.format(numeric)
    : inrFormatter.format(0);
  const cleanLabel = (priceLabel || "").trim();
  return cleanLabel ? `${cleanLabel} ${formatted}` : formatted;
}

export function parseInclusionsInput(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }
  return [];
}

export function formatInclusionsForInput(inclusions) {
  if (!Array.isArray(inclusions)) {
    return "";
  }
  return inclusions.join("\n");
}

export const EMPTY_SERVICE_FORM = {
  name: "",
  category: "Makeup & Styling",
  description: "",
  inclusionsText: "",
  price_inr: "",
  price_label: "",
  icon_name: "AutoAwesome",
  display_order: 1,
  status: "draft",
};


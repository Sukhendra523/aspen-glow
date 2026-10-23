export const APPROVED_HEADING_FONTS = ["Playfair Display", "Georgia", "Lato"];
export const APPROVED_BODY_FONTS = ["Lato", "Helvetica", "Georgia"];

export const DEFAULT_BRAND_SETTINGS = {
  id: 1,
  brand_name: "Aspen Glow by Shilpi",
  short_name: "Aspen Glow",
  tagline: "Bringing the Salon Experience at DevSai Sports Home",
  hero_description:
    "Hello! I am a professionally trained beautician offering a wide range of services exclusively for our society.",
  logo_url: "",
  primary_color: "#d81b60",
  secondary_color: "#880e4f",
  background_color: "#FEFBF6",
  heading_font: "Playfair Display",
  body_font: "Lato",
  status: "published",
};

export const DEFAULT_CONTACT_SETTINGS = {
  id: 1,
  contact_name: "Shilpi Chauhan",
  phone: "7011413546",
  whatsapp: "917011413546",
  address: "703 Aspen Tower, Dev Sai Sports Home, Greater Noida",
  booking_url: "",
  appointment_note:
    "Appointments are highly recommended. Looking forward to pampering you!",
  status: "published",
};

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;
const PHONE_DIGITS_REGEX = /^\+?[0-9\s-]{7,20}$/;

export function isValidHexColor(value) {
  return HEX_COLOR_REGEX.test((value || "").trim());
}

export function isValidPhoneInput(value) {
  const trimmed = (value || "").trim();
  if (!PHONE_DIGITS_REGEX.test(trimmed)) {
    return false;
  }
  const digitsOnly = trimmed.replace(/\D/g, "");
  return digitsOnly.length >= 7 && digitsOnly.length <= 15;
}

export function isValidHttpUrl(value) {
  const trimmed = (value || "").trim();
  if (!trimmed) {
    return true;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function getSafeTelHref(phone) {
  const digitsAndPlus = (phone || "").replace(/[^0-9+]/g, "");
  return digitsAndPlus ? `tel:${digitsAndPlus}` : "#contact";
}

export function getSafeWhatsAppHref(whatsapp) {
  const digitsOnly = (whatsapp || "").replace(/\D/g, "");
  return digitsOnly ? `https://wa.me/${digitsOnly}` : "#contact";
}

export function getSafeExternalUrl(url) {
  const trimmed = (url || "").trim();
  if (!trimmed || !isValidHttpUrl(trimmed)) {
    return "";
  }
  return trimmed;
}


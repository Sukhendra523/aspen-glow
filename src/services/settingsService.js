import { supabase } from "../lib/supabaseClient";
import {
  APPROVED_BODY_FONTS,
  APPROVED_HEADING_FONTS,
  DEFAULT_BRAND_SETTINGS,
  DEFAULT_CONTACT_SETTINGS,
  isValidHexColor,
  isValidHttpUrl,
  isValidPhoneInput,
} from "../constants/defaultSettings";

const SAFE_CONFIG_ERROR =
  "Backend configuration is missing. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY.";
const SAFE_LOAD_ERROR =
  "Unable to load settings from the server. Showing current defaults.";
const SAFE_SAVE_ERROR =
  "Unable to save settings right now. Please verify your permissions and try again.";

const BRAND_COLUMNS =
  "id, brand_name, short_name, tagline, hero_description, logo_url, primary_color, secondary_color, background_color, heading_font, body_font, status, updated_at";
const CONTACT_COLUMNS =
  "id, contact_name, phone, whatsapp, address, booking_url, appointment_note, status, updated_at";

export function validateBrandSettingsInput(input = {}) {
  const errors = {};
  const brand_name = (input.brand_name || "").trim();
  const short_name = (input.short_name || "").trim();
  const tagline = (input.tagline || "").trim();
  const hero_description = (input.hero_description || "").trim();
  const logo_url = (input.logo_url || "").trim();
  const primary_color = (input.primary_color || "").trim();
  const secondary_color = (input.secondary_color || "").trim();
  const background_color = (input.background_color || "").trim();
  const heading_font = (input.heading_font || "").trim();
  const body_font = (input.body_font || "").trim();
  const status = input.status === "draft" ? "draft" : "published";

  if (!brand_name) {
    errors.brand_name = "Brand name is required.";
  } else if (brand_name.length > 100) {
    errors.brand_name = "Brand name must be 100 characters or fewer.";
  }

  if (!short_name) {
    errors.short_name = "Short navigation name is required.";
  } else if (short_name.length > 60) {
    errors.short_name = "Short name must be 60 characters or fewer.";
  }

  if (tagline.length > 200) {
    errors.tagline = "Tagline must be 200 characters or fewer.";
  }

  if (hero_description.length > 500) {
    errors.hero_description =
      "Hero description must be 500 characters or fewer.";
  }

  if (logo_url && !isValidHttpUrl(logo_url)) {
    errors.logo_url = "Logo URL must be a valid http:// or https:// address.";
  }

  if (!isValidHexColor(primary_color)) {
    errors.primary_color = "Primary color must be a 6-digit hex code (e.g. #d81b60).";
  }

  if (!isValidHexColor(secondary_color)) {
    errors.secondary_color =
      "Secondary color must be a 6-digit hex code (e.g. #880e4f).";
  }

  if (!isValidHexColor(background_color)) {
    errors.background_color =
      "Background color must be a 6-digit hex code (e.g. #FEFBF6).";
  }

  if (!APPROVED_HEADING_FONTS.includes(heading_font)) {
    errors.heading_font = "Select an approved heading font.";
  }

  if (!APPROVED_BODY_FONTS.includes(body_font)) {
    errors.body_font = "Select an approved body font.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    cleaned: {
      id: 1,
      brand_name,
      short_name,
      tagline,
      hero_description,
      logo_url,
      primary_color,
      secondary_color,
      background_color,
      heading_font,
      body_font,
      status,
    },
  };
}

export function validateContactSettingsInput(input = {}) {
  const errors = {};
  const contact_name = (input.contact_name || "").trim();
  const phone = (input.phone || "").trim();
  const whatsapp = (input.whatsapp || "").trim();
  const address = (input.address || "").trim();
  const booking_url = (input.booking_url || "").trim();
  const appointment_note = (input.appointment_note || "").trim();
  const status = input.status === "draft" ? "draft" : "published";

  if (!contact_name) {
    errors.contact_name = "Contact person name is required.";
  } else if (contact_name.length > 100) {
    errors.contact_name = "Contact person name must be 100 characters or fewer.";
  }

  if (!phone) {
    errors.phone = "Phone number is required.";
  } else if (!isValidPhoneInput(phone)) {
    errors.phone = "Enter a valid phone number (7 to 15 digits).";
  }

  if (!whatsapp) {
    errors.whatsapp = "WhatsApp number is required.";
  } else if (!isValidPhoneInput(whatsapp)) {
    errors.whatsapp =
      "Enter a valid WhatsApp number with country code (e.g. 917011413546).";
  }

  if (!address) {
    errors.address = "Salon address is required.";
  } else if (address.length > 300) {
    errors.address = "Address must be 300 characters or fewer.";
  }

  if (booking_url && !isValidHttpUrl(booking_url)) {
    errors.booking_url =
      "Booking URL must be a valid http:// or https:// address.";
  }

  if (appointment_note.length > 300) {
    errors.appointment_note =
      "Appointment note must be 300 characters or fewer.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    cleaned: {
      id: 1,
      contact_name,
      phone,
      whatsapp,
      address,
      booking_url,
      appointment_note,
      status,
    },
  };
}

export async function fetchPublicSiteSettings(client = supabase) {
  if (!client) {
    return {
      brand: { ...DEFAULT_BRAND_SETTINGS },
      contact: { ...DEFAULT_CONTACT_SETTINGS },
      error: null,
    };
  }

  try {
    const [brandResponse, contactResponse] = await Promise.all([
      client
        .from("brand_settings")
        .select(BRAND_COLUMNS)
        .eq("id", 1)
        .eq("status", "published")
        .maybeSingle(),
      client
        .from("contact_settings")
        .select(CONTACT_COLUMNS)
        .eq("id", 1)
        .eq("status", "published")
        .maybeSingle(),
    ]);

    const brand =
      !brandResponse.error && brandResponse.data?.status === "published"
        ? { ...DEFAULT_BRAND_SETTINGS, ...brandResponse.data }
        : { ...DEFAULT_BRAND_SETTINGS };

    const contact =
      !contactResponse.error && contactResponse.data?.status === "published"
        ? { ...DEFAULT_CONTACT_SETTINGS, ...contactResponse.data }
        : { ...DEFAULT_CONTACT_SETTINGS };

    return { brand, contact, error: null };
  } catch {
    return {
      brand: { ...DEFAULT_BRAND_SETTINGS },
      contact: { ...DEFAULT_CONTACT_SETTINGS },
      error: null,
    };
  }
}

export async function fetchAdminSiteSettings(client = supabase) {
  if (!client) {
    return {
      brand: { ...DEFAULT_BRAND_SETTINGS },
      contact: { ...DEFAULT_CONTACT_SETTINGS },
      error: SAFE_CONFIG_ERROR,
    };
  }

  try {
    const [brandResponse, contactResponse] = await Promise.all([
      client
        .from("brand_settings")
        .select(BRAND_COLUMNS)
        .eq("id", 1)
        .maybeSingle(),
      client
        .from("contact_settings")
        .select(CONTACT_COLUMNS)
        .eq("id", 1)
        .maybeSingle(),
    ]);

    const hasError = Boolean(brandResponse.error || contactResponse.error);

    return {
      brand: brandResponse.data
        ? { ...DEFAULT_BRAND_SETTINGS, ...brandResponse.data }
        : { ...DEFAULT_BRAND_SETTINGS },
      contact: contactResponse.data
        ? { ...DEFAULT_CONTACT_SETTINGS, ...contactResponse.data }
        : { ...DEFAULT_CONTACT_SETTINGS },
      error: hasError ? SAFE_LOAD_ERROR : null,
    };
  } catch {
    return {
      brand: { ...DEFAULT_BRAND_SETTINGS },
      contact: { ...DEFAULT_CONTACT_SETTINGS },
      error: SAFE_LOAD_ERROR,
    };
  }
}

export async function saveBrandSettings(input, client = supabase) {
  const validation = validateBrandSettingsInput(input);
  if (!validation.valid) {
    return {
      data: null,
      fieldErrors: validation.errors,
      error: "Please fix the highlighted brand settings fields.",
    };
  }

  if (!client) {
    return {
      data: null,
      fieldErrors: {},
      error: SAFE_CONFIG_ERROR,
    };
  }

  try {
    const { data, error } = await client
      .from("brand_settings")
      .upsert(validation.cleaned, { onConflict: "id" })
      .select(BRAND_COLUMNS)
      .single();

    if (error || !data) {
      return {
        data: null,
        fieldErrors: {},
        error: SAFE_SAVE_ERROR,
      };
    }

    return {
      data: { ...DEFAULT_BRAND_SETTINGS, ...data },
      fieldErrors: {},
      error: null,
    };
  } catch {
    return {
      data: null,
      fieldErrors: {},
      error: SAFE_SAVE_ERROR,
    };
  }
}

export async function saveContactSettings(input, client = supabase) {
  const validation = validateContactSettingsInput(input);
  if (!validation.valid) {
    return {
      data: null,
      fieldErrors: validation.errors,
      error: "Please fix the highlighted contact settings fields.",
    };
  }

  if (!client) {
    return {
      data: null,
      fieldErrors: {},
      error: SAFE_CONFIG_ERROR,
    };
  }

  try {
    const { data, error } = await client
      .from("contact_settings")
      .upsert(validation.cleaned, { onConflict: "id" })
      .select(CONTACT_COLUMNS)
      .single();

    if (error || !data) {
      return {
        data: null,
        fieldErrors: {},
        error: SAFE_SAVE_ERROR,
      };
    }

    return {
      data: { ...DEFAULT_CONTACT_SETTINGS, ...data },
      fieldErrors: {},
      error: null,
    };
  } catch {
    return {
      data: null,
      fieldErrors: {},
      error: SAFE_SAVE_ERROR,
    };
  }
}


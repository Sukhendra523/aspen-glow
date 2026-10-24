import { supabase } from "../lib/supabaseClient";
import {
  SERVICE_CATEGORIES,
  SERVICE_ICONS,
  SERVICE_STATUSES,
  parseInclusionsInput,
} from "../constants/serviceCatalogue";

const SAFE_CONFIG_ERROR =
  "Backend configuration is missing. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY.";
const SAFE_LOAD_ERROR =
  "Unable to load services from the server right now. Please try again.";
const SAFE_SAVE_ERROR =
  "Unable to save the service right now. Please check for duplicate names or permission issues.";
const SAFE_ARCHIVE_ERROR =
  "Unable to archive the service right now. Please try again.";

const SERVICE_COLUMNS =
  "id, name, category, description, icon_url, inclusions, price_inr, price_label, icon_name, display_order, status, created_at, updated_at";

export function validateServiceInput(input = {}) {
  const errors = {};
  const name = (input.name || "").trim();
  const category = (input.category || "").trim();
  const description = (input.description || "").trim();
  const priceLabel = (input.price_label || "").trim();
  const iconName = (input.icon_name || "AutoAwesome").trim();
  const iconUrl = (input.icon_url || "").trim();
  const status = (input.status || "draft").trim();

  const rawPrice =
    input.price_inr !== undefined && input.price_inr !== null
      ? String(input.price_inr).trim()
      : "";

  let priceInr = NaN;
  if (!rawPrice) {
    errors.price_inr = "Price in INR is required.";
  } else if (!/^\d+$/.test(rawPrice)) {
    errors.price_inr =
      "Price must be a whole number in INR (no decimals or symbols).";
  } else {
    priceInr = Number(rawPrice);
    if (!Number.isSafeInteger(priceInr) || priceInr < 0 || priceInr > 1000000) {
      errors.price_inr = "Enter a valid price between 0 and 1,000,000 INR.";
    }
  }

  const rawOrder =
    input.display_order !== undefined && input.display_order !== null
      ? String(input.display_order).trim()
      : "0";
  const displayOrder = /^-?\d+$/.test(rawOrder) ? Number(rawOrder) : NaN;
  if (!Number.isSafeInteger(displayOrder)) {
    errors.display_order = "Display order must be a whole number.";
  }

  if (!name) {
    errors.name = "Service name is required.";
  } else if (name.length > 120) {
    errors.name = "Service name must be 120 characters or fewer.";
  }

  if (!SERVICE_CATEGORIES.includes(category)) {
    errors.category = "Select a valid service category.";
  }

  if (description.length > 500) {
    errors.description = "Description must be 500 characters or fewer.";
  }

  if (priceLabel.length > 60) {
    errors.price_label = "Price prefix must be 60 characters or fewer.";
  }

  if (!SERVICE_ICONS.includes(iconName)) {
    errors.icon_name = "Select an approved service icon.";
  }

  if (
    iconUrl &&
    (iconUrl.length > 500 ||
      (!iconUrl.startsWith("/") && !/^https?:\/\//i.test(iconUrl)))
  ) {
    errors.icon_url =
      "Icon URL must be a valid Media Library URL or local asset path.";
  }

  if (!SERVICE_STATUSES.includes(status)) {
    errors.status = "Select a valid lifecycle status.";
  }

  const inclusions = parseInclusionsInput(
    input.inclusionsText !== undefined ? input.inclusionsText : input.inclusions
  );
  if (inclusions.length > 20) {
    errors.inclusions = "Include at most 20 bullet items.";
  } else if (inclusions.some((item) => item.length > 200)) {
    errors.inclusions = "Each inclusion item must be 200 characters or fewer.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    cleaned: {
      name,
      category,
      description,
      inclusions,
      price_inr: Number.isNaN(priceInr) ? 0 : priceInr,
      price_label: priceLabel,
      icon_name: iconName,
      ...(iconUrl ? { icon_url: iconUrl } : {}),
      display_order: Number.isNaN(displayOrder) ? 0 : displayOrder,
      status,
    },
  };
}

export async function fetchAdminServices(client = supabase) {
  if (!client) {
    return { data: [], error: SAFE_CONFIG_ERROR };
  }

  try {
    const { data, error } = await client
      .from("services")
      .select(SERVICE_COLUMNS)
      .order("category", { ascending: true })
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      return { data: [], error: SAFE_LOAD_ERROR };
    }

    return { data: Array.isArray(data) ? data : [], error: null };
  } catch {
    return { data: [], error: SAFE_LOAD_ERROR };
  }
}

export async function fetchPublishedServices(client = supabase) {
  if (!client) {
    return { data: [], error: null };
  }

  try {
    const { data, error } = await client
      .from("services")
      .select(SERVICE_COLUMNS)
      .eq("status", "published")
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      return { data: [], error: SAFE_LOAD_ERROR };
    }

    return { data: Array.isArray(data) ? data : [], error: null };
  } catch {
    return { data: [], error: SAFE_LOAD_ERROR };
  }
}

export async function createServiceRecord(input, client = supabase) {
  const validation = validateServiceInput(input);
  if (!validation.valid) {
    return {
      data: null,
      fieldErrors: validation.errors,
      error: "Please fix the highlighted service fields.",
    };
  }

  if (!client) {
    return { data: null, fieldErrors: {}, error: SAFE_CONFIG_ERROR };
  }

  try {
    const { data, error } = await client
      .from("services")
      .insert(validation.cleaned)
      .select(SERVICE_COLUMNS)
      .single();

    if (error || !data) {
      return { data: null, fieldErrors: {}, error: SAFE_SAVE_ERROR };
    }

    return { data, fieldErrors: {}, error: null };
  } catch {
    return { data: null, fieldErrors: {}, error: SAFE_SAVE_ERROR };
  }
}

export async function updateServiceRecord(id, input, client = supabase) {
  if (!id) {
    return {
      data: null,
      fieldErrors: {},
      error: "Service ID is required for update.",
    };
  }

  const validation = validateServiceInput(input);
  if (!validation.valid) {
    return {
      data: null,
      fieldErrors: validation.errors,
      error: "Please fix the highlighted service fields.",
    };
  }

  if (!client) {
    return { data: null, fieldErrors: {}, error: SAFE_CONFIG_ERROR };
  }

  try {
    const { data, error } = await client
      .from("services")
      .update(validation.cleaned)
      .eq("id", id)
      .select(SERVICE_COLUMNS)
      .single();

    if (error || !data) {
      return { data: null, fieldErrors: {}, error: SAFE_SAVE_ERROR };
    }

    return { data, fieldErrors: {}, error: null };
  } catch {
    return { data: null, fieldErrors: {}, error: SAFE_SAVE_ERROR };
  }
}

export async function archiveServiceRecord(id, client = supabase) {
  if (!id) {
    return { data: null, error: "Service ID is required to archive." };
  }

  if (!client) {
    return { data: null, error: SAFE_CONFIG_ERROR };
  }

  try {
    const { data, error } = await client
      .from("services")
      .update({ status: "archived" })
      .eq("id", id)
      .select(SERVICE_COLUMNS)
      .single();

    if (error || !data) {
      return { data: null, error: SAFE_ARCHIVE_ERROR };
    }

    return { data, error: null };
  } catch {
    return { data: null, error: SAFE_ARCHIVE_ERROR };
  }
}


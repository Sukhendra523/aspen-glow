import { supabase } from "../lib/supabaseClient";
import { SERVICE_ICONS, SERVICE_STATUSES } from "../constants/serviceCatalogue";

const SAFE_CONFIG_ERROR =
  "Backend configuration is missing. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY.";
const SAFE_LOAD_ERROR =
  "Unable to load packages from the server right now. Please try again.";
const SAFE_SAVE_ERROR =
  "Unable to save the package right now. Please check for duplicate names or permission issues.";
const SAFE_ARCHIVE_ERROR =
  "Unable to archive the package right now. Please try again.";

const PACKAGE_SELECT_QUERY =
  "id, name, description, price_inr, icon_name, display_order, status, package_group, tagline, badge_text, card_color, created_at, updated_at, package_services(id, service_id, display_order, inclusion_note, service:services(id, name, category, price_inr, status))";

export const PACKAGE_GROUPS = [
  "Multi-Service Packages",
  "Cleanup Packages",
  "Festive Luxe Packages",
];

export const EMPTY_PACKAGE_FORM = {
  name: "",
  description: "",
  price_inr: "",
  icon_name: "AutoAwesome",
  icon_url: "",
  display_order: 1,
  status: "draft",
  package_group: "Multi-Service Packages",
  tagline: "",
  badge_text: "",
  card_color: "",
  service_items: [],
};

export function formatPackageServiceLine(item) {
  if (!item) return "";
  const baseName = (
    item.service?.name ||
    item.service_name ||
    item.name ||
    ""
  ).trim();
  const note = (item.inclusion_note || "").trim();
  if (!baseName) return note;
  return note ? `${baseName} ${note}` : baseName;
}

export function normalizePackageRecord(pkg) {
  if (!pkg) return null;
  const rawItems = Array.isArray(pkg.package_services)
    ? [...pkg.package_services]
    : [];
  rawItems.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  return {
    ...pkg,
    package_services: rawItems,
    items: rawItems
      .map((item) => formatPackageServiceLine(item))
      .filter(Boolean),
  };
}

export function validatePackageInput(input = {}) {
  const errors = {};
  const name = (input.name || "").trim();
  const description = (input.description || "").trim();
  const iconName = (input.icon_name || "AutoAwesome").trim();
  const status = (input.status || "draft").trim();

  const rawPrice =
    input.price_inr !== undefined && input.price_inr !== null
      ? String(input.price_inr).trim()
      : "";

  let priceInr = NaN;
  if (!rawPrice) {
    errors.price_inr = "Package price in INR is required.";
  } else if (!/^\d+$/.test(rawPrice)) {
    errors.price_inr =
      "Package price must be a whole number in INR (no decimals or symbols).";
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
    errors.name = "Package name is required.";
  } else if (name.length > 120) {
    errors.name = "Package name must be 120 characters or fewer.";
  }

  if (description.length > 500) {
    errors.description = "Description must be 500 characters or fewer.";
  }

  if (!SERVICE_ICONS.includes(iconName)) {
    errors.icon_name = "Select an approved package icon.";
  }

  const iconUrl = (input.icon_url || "").trim();
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

  const rawServiceItems = Array.isArray(input.service_items)
    ? input.service_items
    : [];
  const cleanedServiceItems = [];
  const seenServiceIds = new Set();

  rawServiceItems.forEach((item, index) => {
    const serviceId = (item?.service_id || "").trim();
    const inclusionNote = (item?.inclusion_note || "").trim();
    if (!serviceId) {
      return;
    }
    if (seenServiceIds.has(serviceId)) {
      errors.service_items =
        "Each service can only be added once to the same package.";
      return;
    }
    if (inclusionNote.length > 120) {
      errors.service_items =
        "Service inclusion notes must be 120 characters or fewer.";
      return;
    }
    seenServiceIds.add(serviceId);
    cleanedServiceItems.push({
      service_id: serviceId,
      display_order: index + 1,
      inclusion_note: inclusionNote,
    });
  });

  if (cleanedServiceItems.length === 0 && !errors.service_items) {
    errors.service_items = "Select at least one service for this package.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    cleaned: {
      packageFields: {
        name,
        description,
        price_inr: Number.isNaN(priceInr) ? 0 : priceInr,
        icon_name: iconName,
        ...(iconUrl ? { icon_url: iconUrl } : {}),
        display_order: Number.isNaN(displayOrder) ? 0 : displayOrder,
        status,
        ...(input.package_group !== undefined
          ? { package_group: String(input.package_group || "Multi-Service Packages").trim() }
          : {}),
        ...(input.tagline !== undefined
          ? { tagline: String(input.tagline || "").trim() }
          : {}),
        ...(input.badge_text !== undefined
          ? { badge_text: String(input.badge_text || "").trim() }
          : {}),
        ...(input.card_color !== undefined
          ? { card_color: String(input.card_color || "").trim() }
          : {}),
      },
      serviceItems: cleanedServiceItems,
    },
  };
}

export async function fetchAdminPackages(client = supabase) {
  if (!client) {
    return { data: [], error: SAFE_CONFIG_ERROR };
  }

  try {
    const { data, error } = await client
      .from("packages")
      .select(PACKAGE_SELECT_QUERY)
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      return { data: [], error: SAFE_LOAD_ERROR };
    }

    const normalized = Array.isArray(data)
      ? data.map(normalizePackageRecord)
      : [];
    return { data: normalized, error: null };
  } catch {
    return { data: [], error: SAFE_LOAD_ERROR };
  }
}

export async function fetchPublishedPackages(client = supabase) {
  if (!client) {
    return { data: [], error: null };
  }

  try {
    const { data, error } = await client
      .from("packages")
      .select(PACKAGE_SELECT_QUERY)
      .eq("status", "published")
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      return { data: [], error: SAFE_LOAD_ERROR };
    }

    const normalized = Array.isArray(data)
      ? data
          .filter((pkg) => pkg.status === "published")
          .map(normalizePackageRecord)
      : [];
    return { data: normalized, error: null };
  } catch {
    return { data: [], error: SAFE_LOAD_ERROR };
  }
}

export async function createPackageRecord(input, client = supabase) {
  const validation = validatePackageInput(input);
  if (!validation.valid) {
    return {
      data: null,
      fieldErrors: validation.errors,
      error: "Please fix the highlighted package fields.",
    };
  }

  if (!client) {
    return { data: null, fieldErrors: {}, error: SAFE_CONFIG_ERROR };
  }

  try {
    const { data: createdPkg, error: pkgError } = await client
      .from("packages")
      .insert(validation.cleaned.packageFields)
      .select("id")
      .single();

    if (pkgError || !createdPkg?.id) {
      return { data: null, fieldErrors: {}, error: SAFE_SAVE_ERROR };
    }

    const joinPayload = validation.cleaned.serviceItems.map((item) => ({
      package_id: createdPkg.id,
      ...item,
    }));

    const { error: joinError } = await client
      .from("package_services")
      .insert(joinPayload);

    if (joinError) {
      return { data: null, fieldErrors: {}, error: SAFE_SAVE_ERROR };
    }

    const { data: fullRecord, error: fetchError } = await client
      .from("packages")
      .select(PACKAGE_SELECT_QUERY)
      .eq("id", createdPkg.id)
      .single();

    if (fetchError || !fullRecord) {
      return { data: null, fieldErrors: {}, error: SAFE_SAVE_ERROR };
    }

    return {
      data: normalizePackageRecord(fullRecord),
      fieldErrors: {},
      error: null,
    };
  } catch {
    return { data: null, fieldErrors: {}, error: SAFE_SAVE_ERROR };
  }
}

export async function updatePackageRecord(id, input, client = supabase) {
  if (!id) {
    return {
      data: null,
      fieldErrors: {},
      error: "Package ID is required for update.",
    };
  }

  const validation = validatePackageInput(input);
  if (!validation.valid) {
    return {
      data: null,
      fieldErrors: validation.errors,
      error: "Please fix the highlighted package fields.",
    };
  }

  if (!client) {
    return { data: null, fieldErrors: {}, error: SAFE_CONFIG_ERROR };
  }

  try {
    const { error: updateError } = await client
      .from("packages")
      .update(validation.cleaned.packageFields)
      .eq("id", id);

    if (updateError) {
      return { data: null, fieldErrors: {}, error: SAFE_SAVE_ERROR };
    }

    const { error: deleteJoinError } = await client
      .from("package_services")
      .delete()
      .eq("package_id", id);

    if (deleteJoinError) {
      return { data: null, fieldErrors: {}, error: SAFE_SAVE_ERROR };
    }

    const joinPayload = validation.cleaned.serviceItems.map((item) => ({
      package_id: id,
      ...item,
    }));

    const { error: insertJoinError } = await client
      .from("package_services")
      .insert(joinPayload);

    if (insertJoinError) {
      return { data: null, fieldErrors: {}, error: SAFE_SAVE_ERROR };
    }

    const { data: fullRecord, error: fetchError } = await client
      .from("packages")
      .select(PACKAGE_SELECT_QUERY)
      .eq("id", id)
      .single();

    if (fetchError || !fullRecord) {
      return { data: null, fieldErrors: {}, error: SAFE_SAVE_ERROR };
    }

    return {
      data: normalizePackageRecord(fullRecord),
      fieldErrors: {},
      error: null,
    };
  } catch {
    return { data: null, fieldErrors: {}, error: SAFE_SAVE_ERROR };
  }
}

export async function archivePackageRecord(id, client = supabase) {
  if (!id) {
    return { data: null, error: "Package ID is required to archive." };
  }

  if (!client) {
    return { data: null, error: SAFE_CONFIG_ERROR };
  }

  try {
    const { data, error } = await client
      .from("packages")
      .update({ status: "archived" })
      .eq("id", id)
      .select(PACKAGE_SELECT_QUERY)
      .single();

    if (error || !data) {
      return { data: null, error: SAFE_ARCHIVE_ERROR };
    }

    return { data: normalizePackageRecord(data), error: null };
  } catch {
    return { data: null, error: SAFE_ARCHIVE_ERROR };
  }
}


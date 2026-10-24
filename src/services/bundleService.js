import { supabase } from "../lib/supabaseClient";
import { SERVICE_ICONS, SERVICE_STATUSES } from "../constants/serviceCatalogue";

const SAFE_CONFIG_ERROR =
  "Backend configuration is missing. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY.";
const SAFE_LOAD_ERROR =
  "Unable to load bundles from the server right now. Please try again.";
const SAFE_SAVE_ERROR =
  "Unable to save the bundle right now. Please check for duplicate names or permission issues.";
const SAFE_ARCHIVE_ERROR =
  "Unable to archive the bundle right now. Please try again.";

const BUNDLE_SELECT_QUERY =
  "id, name, description, price_inr, icon_name, display_order, status, tagline, badge_text, card_color, created_at, updated_at, bundle_packages(id, package_id, display_order, package:packages(id, name, description, price_inr, status))";

export const EMPTY_BUNDLE_FORM = {
  name: "",
  description: "",
  price_inr: "",
  icon_name: "Star",
  icon_url: "",
  display_order: 1,
  status: "draft",
  tagline: "",
  badge_text: "",
  card_color: "",
  package_items: [],
};

export function formatBundlePackageLine(item) {
  if (!item) return "";
  return (
    item.package?.name ||
    item.package_name ||
    item.name ||
    ""
  ).trim();
}

export function normalizeBundleRecord(bundle) {
  if (!bundle) return null;
  const rawItems = Array.isArray(bundle.bundle_packages)
    ? [...bundle.bundle_packages]
    : [];
  rawItems.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  return {
    ...bundle,
    bundle_packages: rawItems,
    items: rawItems
      .map((item) => formatBundlePackageLine(item))
      .filter(Boolean),
  };
}

export function validateBundleInput(input = {}) {
  const errors = {};
  const name = (input.name || "").trim();
  const description = (input.description || "").trim();
  const iconName = (input.icon_name || "Star").trim();
  const status = (input.status || "draft").trim();

  const rawPrice =
    input.price_inr !== undefined && input.price_inr !== null
      ? String(input.price_inr).trim()
      : "";

  let priceInr = NaN;
  if (!rawPrice) {
    errors.price_inr = "Promotional price in INR is required.";
  } else if (!/^\d+$/.test(rawPrice)) {
    errors.price_inr =
      "Promotional price must be a whole number in INR (no decimals or symbols).";
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
    errors.name = "Bundle name is required.";
  } else if (name.length > 120) {
    errors.name = "Bundle name must be 120 characters or fewer.";
  }

  if (description.length > 500) {
    errors.description = "Description must be 500 characters or fewer.";
  }

  if (!SERVICE_ICONS.includes(iconName)) {
    errors.icon_name = "Select an approved bundle icon.";
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

  const rawPackageItems = Array.isArray(input.package_items)
    ? input.package_items
    : [];
  const cleanedPackageItems = [];
  const seenPackageIds = new Set();

  rawPackageItems.forEach((item, index) => {
    const packageId = (item?.package_id || "").trim();
    if (!packageId) {
      return;
    }
    if (seenPackageIds.has(packageId)) {
      errors.package_items =
        "Each package can only be added once to the same bundle.";
      return;
    }
    seenPackageIds.add(packageId);
    cleanedPackageItems.push({
      package_id: packageId,
      display_order: index + 1,
    });
  });

  if (cleanedPackageItems.length === 0 && !errors.package_items) {
    errors.package_items = "Select at least one package for this bundle.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    cleaned: {
      bundleFields: {
        name,
        description,
        price_inr: Number.isNaN(priceInr) ? 0 : priceInr,
        icon_name: iconName,
        ...(iconUrl ? { icon_url: iconUrl } : {}),
        display_order: Number.isNaN(displayOrder) ? 0 : displayOrder,
        status,
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
      packageItems: cleanedPackageItems,
    },
  };
}

export async function fetchAdminBundles(client = supabase) {
  if (!client) {
    return { data: [], error: SAFE_CONFIG_ERROR };
  }

  try {
    const { data, error } = await client
      .from("bundles")
      .select(BUNDLE_SELECT_QUERY)
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      return { data: [], error: SAFE_LOAD_ERROR };
    }

    const normalized = Array.isArray(data)
      ? data.map(normalizeBundleRecord)
      : [];
    return { data: normalized, error: null };
  } catch {
    return { data: [], error: SAFE_LOAD_ERROR };
  }
}

export async function fetchPublishedBundles(client = supabase) {
  if (!client) {
    return { data: [], error: null };
  }

  try {
    const { data, error } = await client
      .from("bundles")
      .select(BUNDLE_SELECT_QUERY)
      .eq("status", "published")
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      return { data: [], error: SAFE_LOAD_ERROR };
    }

    const normalized = Array.isArray(data)
      ? data
          .filter((b) => b.status === "published")
          .map(normalizeBundleRecord)
      : [];
    return { data: normalized, error: null };
  } catch {
    return { data: [], error: SAFE_LOAD_ERROR };
  }
}

export async function createBundleRecord(input, client = supabase) {
  const validation = validateBundleInput(input);
  if (!validation.valid) {
    return {
      data: null,
      fieldErrors: validation.errors,
      error: "Please fix the highlighted bundle fields.",
    };
  }

  if (!client) {
    return { data: null, fieldErrors: {}, error: SAFE_CONFIG_ERROR };
  }

  try {
    const { data: createdBundle, error: bundleError } = await client
      .from("bundles")
      .insert(validation.cleaned.bundleFields)
      .select("id")
      .single();

    if (bundleError || !createdBundle?.id) {
      return { data: null, fieldErrors: {}, error: SAFE_SAVE_ERROR };
    }

    const joinPayload = validation.cleaned.packageItems.map((item) => ({
      bundle_id: createdBundle.id,
      ...item,
    }));

    const { error: joinError } = await client
      .from("bundle_packages")
      .insert(joinPayload);

    if (joinError) {
      return { data: null, fieldErrors: {}, error: SAFE_SAVE_ERROR };
    }

    const { data: fullRecord, error: fetchError } = await client
      .from("bundles")
      .select(BUNDLE_SELECT_QUERY)
      .eq("id", createdBundle.id)
      .single();

    if (fetchError || !fullRecord) {
      return { data: null, fieldErrors: {}, error: SAFE_SAVE_ERROR };
    }

    return {
      data: normalizeBundleRecord(fullRecord),
      fieldErrors: {},
      error: null,
    };
  } catch {
    return { data: null, fieldErrors: {}, error: SAFE_SAVE_ERROR };
  }
}

export async function updateBundleRecord(id, input, client = supabase) {
  if (!id) {
    return {
      data: null,
      fieldErrors: {},
      error: "Bundle ID is required for update.",
    };
  }

  const validation = validateBundleInput(input);
  if (!validation.valid) {
    return {
      data: null,
      fieldErrors: validation.errors,
      error: "Please fix the highlighted bundle fields.",
    };
  }

  if (!client) {
    return { data: null, fieldErrors: {}, error: SAFE_CONFIG_ERROR };
  }

  try {
    const { error: updateError } = await client
      .from("bundles")
      .update(validation.cleaned.bundleFields)
      .eq("id", id);

    if (updateError) {
      return { data: null, fieldErrors: {}, error: SAFE_SAVE_ERROR };
    }

    const { error: deleteJoinError } = await client
      .from("bundle_packages")
      .delete()
      .eq("bundle_id", id);

    if (deleteJoinError) {
      return { data: null, fieldErrors: {}, error: SAFE_SAVE_ERROR };
    }

    const joinPayload = validation.cleaned.packageItems.map((item) => ({
      bundle_id: id,
      ...item,
    }));

    const { error: insertJoinError } = await client
      .from("bundle_packages")
      .insert(joinPayload);

    if (insertJoinError) {
      return { data: null, fieldErrors: {}, error: SAFE_SAVE_ERROR };
    }

    const { data: fullRecord, error: fetchError } = await client
      .from("bundles")
      .select(BUNDLE_SELECT_QUERY)
      .eq("id", id)
      .single();

    if (fetchError || !fullRecord) {
      return { data: null, fieldErrors: {}, error: SAFE_SAVE_ERROR };
    }

    return {
      data: normalizeBundleRecord(fullRecord),
      fieldErrors: {},
      error: null,
    };
  } catch {
    return { data: null, fieldErrors: {}, error: SAFE_SAVE_ERROR };
  }
}

export async function archiveBundleRecord(id, client = supabase) {
  if (!id) {
    return { data: null, error: "Bundle ID is required to archive." };
  }

  if (!client) {
    return { data: null, error: SAFE_CONFIG_ERROR };
  }

  try {
    const { data, error } = await client
      .from("bundles")
      .update({ status: "archived" })
      .eq("id", id)
      .select(BUNDLE_SELECT_QUERY)
      .single();

    if (error || !data) {
      return { data: null, error: SAFE_ARCHIVE_ERROR };
    }

    return { data: normalizeBundleRecord(data), error: null };
  } catch {
    return { data: null, error: SAFE_ARCHIVE_ERROR };
  }
}


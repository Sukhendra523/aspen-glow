import { supabase } from "../lib/supabaseClient";
import { isValidHexColor } from "../constants/defaultSettings";
import {
  DEFAULT_FESTIVALS,
  DEFAULT_POSTER_TEMPLATES,
} from "../poster/posterTemplates";

const SAFE_CONFIG_ERROR =
  "Backend configuration is missing. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY.";
const SAFE_SAVE_ERROR =
  "Unable to save the festival right now. Please check for duplicate names or permission issues.";

const FESTIVAL_COLUMNS =
  "id, name, category, default_headline, default_subheadline, motif_label, accent_color, active, display_order, created_at, updated_at";
const TEMPLATE_COLUMNS =
  "id, template_key, name, version, supported_formats, layout_config, active, created_at, updated_at";

export function validateFestivalInput(input = {}) {
  const errors = {};
  const name = (input.name || "").trim();
  const category = (input.category || "Indian Festival").trim();
  const default_headline = (input.default_headline || "").trim();
  const default_subheadline = (input.default_subheadline || "").trim();
  const motif_label = (input.motif_label || "✨").trim();
  const accent_color = (input.accent_color || "#d81b60").trim();

  if (!name) {
    errors.name = "Festival name is required.";
  } else if (name.length > 80) {
    errors.name = "Festival name must be 80 characters or fewer.";
  }

  if (!category || category.length > 60) {
    errors.category = "Category is required (60 characters or fewer).";
  }

  if (default_headline.length > 120) {
    errors.default_headline = "Default headline must be 120 characters or fewer.";
  }

  if (default_subheadline.length > 200) {
    errors.default_subheadline =
      "Default subheadline must be 200 characters or fewer.";
  }

  if (!motif_label || motif_label.length > 40) {
    errors.motif_label = "Motif label must be 1 to 40 characters.";
  }

  if (!isValidHexColor(accent_color)) {
    errors.accent_color =
      "Accent color must be a 6-digit hex code (e.g. #c2185b).";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    cleaned: {
      name,
      category,
      default_headline,
      default_subheadline,
      motif_label,
      accent_color,
      active: input.active !== false,
      display_order: Number(input.display_order) || 10,
    },
  };
}

export async function fetchAdminFestivals(client = supabase) {
  if (!client) {
    return { data: [...DEFAULT_FESTIVALS], error: null };
  }

  try {
    const { data, error } = await client
      .from("festivals")
      .select(FESTIVAL_COLUMNS)
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });

    if (error || !Array.isArray(data) || data.length === 0) {
      return { data: [...DEFAULT_FESTIVALS], error: null };
    }

    return { data, error: null };
  } catch {
    return { data: [...DEFAULT_FESTIVALS], error: null };
  }
}

export async function createFestivalRecord(input, client = supabase) {
  const validation = validateFestivalInput(input);
  if (!validation.valid) {
    return {
      data: null,
      fieldErrors: validation.errors,
      error: "Please fix the highlighted festival fields.",
    };
  }

  if (!client) {
    return { data: null, fieldErrors: {}, error: SAFE_CONFIG_ERROR };
  }

  try {
    const { data, error } = await client
      .from("festivals")
      .insert(validation.cleaned)
      .select(FESTIVAL_COLUMNS)
      .single();

    if (error || !data) {
      return { data: null, fieldErrors: {}, error: SAFE_SAVE_ERROR };
    }

    return { data, fieldErrors: {}, error: null };
  } catch {
    return { data: null, fieldErrors: {}, error: SAFE_SAVE_ERROR };
  }
}

export async function fetchPosterTemplates(client = supabase) {
  if (!client) {
    return { data: [...DEFAULT_POSTER_TEMPLATES], error: null };
  }

  try {
    const { data, error } = await client
      .from("poster_templates")
      .select(TEMPLATE_COLUMNS)
      .eq("active", true)
      .order("name", { ascending: true });

    if (error || !Array.isArray(data) || data.length === 0) {
      return { data: [...DEFAULT_POSTER_TEMPLATES], error: null };
    }

    return { data, error: null };
  } catch {
    return { data: [...DEFAULT_POSTER_TEMPLATES], error: null };
  }
}


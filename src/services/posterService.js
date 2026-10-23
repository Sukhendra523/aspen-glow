import { supabase } from "../lib/supabaseClient";

const SAFE_CONFIG_ERROR =
  "Backend configuration is missing. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY.";
const SAFE_LOAD_ERROR =
  "Unable to load saved posters right now. Please try again.";
const SAFE_SAVE_ERROR =
  "Unable to save poster draft right now. Please try again.";
const SAFE_ARCHIVE_ERROR =
  "Unable to archive the poster draft right now. Please try again.";

const POSTER_COLUMNS =
  "id, campaign_name, festival_id, template_key, template_version, format_key, status, structured_config, content_snapshot, export_metadata, created_at, updated_at";

export async function fetchAdminPosters(client = supabase) {
  if (!client) {
    return { data: [], error: SAFE_CONFIG_ERROR };
  }

  try {
    const { data, error } = await client
      .from("posters")
      .select(POSTER_COLUMNS)
      .order("updated_at", { ascending: false });

    if (error) {
      return { data: [], error: SAFE_LOAD_ERROR };
    }

    return { data: Array.isArray(data) ? data : [], error: null };
  } catch {
    return { data: [], error: SAFE_LOAD_ERROR };
  }
}

export async function savePosterDraft(
  {
    id = null,
    campaignName,
    festivalId = null,
    templateKey,
    templateVersion = 1,
    formatKey = "square_1080",
    structuredConfig = {},
    snapshot,
  } = {},
  client = supabase
) {
  const cleanName = (campaignName || "").trim();
  if (!cleanName) {
    return {
      data: null,
      error: "Campaign name is required to save a poster draft.",
    };
  }

  if (!snapshot || typeof snapshot !== "object") {
    return {
      data: null,
      error: "Poster snapshot is required to save a draft.",
    };
  }

  if (!client) {
    return { data: null, error: SAFE_CONFIG_ERROR };
  }

  // Deep-clone snapshot so saved draft is strictly immutable
  const immutableSnapshot = JSON.parse(JSON.stringify(snapshot));

  const payload = {
    campaign_name: cleanName,
    festival_id: festivalId || null,
    template_key: templateKey || immutableSnapshot.template?.template_key || "festive_grid_v1",
    template_version:
      Number(templateVersion) || Number(immutableSnapshot.template?.version) || 1,
    format_key: formatKey || immutableSnapshot.template?.format_key || "square_1080",
    status: "draft",
    structured_config: structuredConfig || {},
    content_snapshot: immutableSnapshot,
  };

  try {
    if (id) {
      const { data, error } = await client
        .from("posters")
        .update(payload)
        .eq("id", id)
        .select(POSTER_COLUMNS)
        .single();

      if (error || !data) {
        return { data: null, error: SAFE_SAVE_ERROR };
      }
      return { data, error: null };
    }

    const { data, error } = await client
      .from("posters")
      .insert(payload)
      .select(POSTER_COLUMNS)
      .single();

    if (error || !data) {
      return { data: null, error: SAFE_SAVE_ERROR };
    }

    return { data, error: null };
  } catch {
    return { data: null, error: SAFE_SAVE_ERROR };
  }
}

export async function recordPosterExportMetadata(
  posterId,
  exportMeta = {},
  client = supabase
) {
  if (!posterId || !client) {
    return { data: null, error: null };
  }

  try {
    const metadata = {
      last_exported_at: new Date().toISOString(),
      filename: exportMeta.filename || "",
      width: Number(exportMeta.width) || 1080,
      height: Number(exportMeta.height) || 1080,
      format_key: exportMeta.formatKey || "square_1080",
    };

    const { data, error } = await client
      .from("posters")
      .update({ export_metadata: metadata })
      .eq("id", posterId)
      .select(POSTER_COLUMNS)
      .single();

    if (error) {
      return { data: null, error: null };
    }
    return { data, error: null };
  } catch {
    return { data: null, error: null };
  }
}

export async function archivePosterRecord(id, client = supabase) {
  if (!id) {
    return { data: null, error: "Poster ID is required to archive." };
  }

  if (!client) {
    return { data: null, error: SAFE_CONFIG_ERROR };
  }

  try {
    const { data, error } = await client
      .from("posters")
      .update({ status: "archived" })
      .eq("id", id)
      .select(POSTER_COLUMNS)
      .single();

    if (error || !data) {
      return { data: null, error: SAFE_ARCHIVE_ERROR };
    }

    return { data, error: null };
  } catch {
    return { data: null, error: SAFE_ARCHIVE_ERROR };
  }
}


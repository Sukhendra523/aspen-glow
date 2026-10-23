import { supabase } from "../lib/supabaseClient";
import { isValidHttpUrl } from "../constants/defaultSettings";
import { fetchAdminSiteSettings, saveBrandSettings } from "./settingsService";

export const MEDIA_BUCKET = "salon-media";
export const MAX_MEDIA_FILE_BYTES = 2 * 1024 * 1024; // 2 MB
export const ALLOWED_MEDIA_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
];
export const ALLOWED_MEDIA_EXTENSIONS = ["png", "jpg", "jpeg", "webp"];
export const MEDIA_CATEGORIES = ["logo", "poster_motif", "general"];

const SAFE_CONFIG_ERROR =
  "Backend configuration is missing. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY.";
const SAFE_LOAD_ERROR =
  "Unable to load media assets right now. Please try again.";
const SAFE_UPLOAD_ERROR =
  "Unable to upload the image right now. Verify your administrator permissions and file format.";
const SAFE_ARCHIVE_ERROR =
  "Unable to archive the media asset right now. Please try again.";

const MEDIA_COLUMNS =
  "id, label, category, bucket_name, storage_path, public_url, mime_type, size_bytes, status, created_at, updated_at";

export function formatFileSize(bytes) {
  const numeric = Number(bytes);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "0 KB";
  }
  const kb = numeric / 1024;
  if (kb < 1024) {
    return `${Math.max(1, Math.round(kb))} KB`;
  }
  return `${(kb / 1024).toFixed(2)} MB`;
}

export function buildSafeStoragePath(category, originalName, timestamp = Date.now()) {
  const safeCategory = MEDIA_CATEGORIES.includes(category)
    ? category
    : "general";
  const rawName = String(originalName || "asset.png")
    .split(/[/\\]/)
    .pop();
  const parts = rawName.split(".");
  const rawExt = parts.length > 1 ? parts.pop().toLowerCase() : "png";
  const ext = ALLOWED_MEDIA_EXTENSIONS.includes(rawExt) ? rawExt : "png";
  const baseName =
    parts
      .join("-")
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "image";

  const randomSuffix = Math.random().toString(36).slice(2, 8);
  return `${safeCategory}/${timestamp}-${randomSuffix}-${baseName}.${ext}`;
}

export function validateMediaUpload({ label, category, file } = {}) {
  const errors = {};
  const cleanLabel = (label || "").trim();
  const cleanCategory = (category || "logo").trim();

  if (!cleanLabel) {
    errors.label = "Asset label is required.";
  } else if (cleanLabel.length > 120) {
    errors.label = "Asset label must be 120 characters or fewer.";
  }

  if (!MEDIA_CATEGORIES.includes(cleanCategory)) {
    errors.category = "Select a valid media category.";
  }

  if (!file) {
    errors.file = "Please choose an image file to upload.";
  } else {
    const mimeType = (file.type || "").toLowerCase();
    const fileName = String(file.name || "");
    const ext = fileName.includes(".")
      ? fileName.split(".").pop().toLowerCase()
      : "";

    if (!ALLOWED_MEDIA_MIME_TYPES.includes(mimeType)) {
      errors.file =
        "Only raster images (PNG, JPEG, WebP) are allowed. SVG and active formats are blocked.";
    } else if (!ALLOWED_MEDIA_EXTENSIONS.includes(ext)) {
      errors.file =
        "File extension must be .png, .jpg, .jpeg, or .webp.";
    } else if (typeof file.size !== "number" || file.size <= 0) {
      errors.file = "Selected file is empty.";
    } else if (file.size > MAX_MEDIA_FILE_BYTES) {
      errors.file = "File size must be 2 MB or smaller.";
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    cleaned: {
      label: cleanLabel,
      category: cleanCategory,
      file,
    },
  };
}

export async function fetchAdminMediaAssets(client = supabase) {
  if (!client) {
    return { data: [], error: SAFE_CONFIG_ERROR };
  }

  try {
    const { data, error } = await client
      .from("media_assets")
      .select(MEDIA_COLUMNS)
      .order("created_at", { ascending: false });

    if (error) {
      return { data: [], error: SAFE_LOAD_ERROR };
    }

    return { data: Array.isArray(data) ? data : [], error: null };
  } catch {
    return { data: [], error: SAFE_LOAD_ERROR };
  }
}

export async function uploadMediaAsset(input, client = supabase) {
  const validation = validateMediaUpload(input);
  if (!validation.valid) {
    return {
      data: null,
      fieldErrors: validation.errors,
      error: "Please fix the highlighted upload fields.",
    };
  }

  if (!client) {
    return { data: null, fieldErrors: {}, error: SAFE_CONFIG_ERROR };
  }

  const { label, category, file } = validation.cleaned;
  const storagePath = buildSafeStoragePath(category, file.name);

  try {
    const storageBucket = client.storage.from(MEDIA_BUCKET);
    const { error: uploadError } = await storageBucket.upload(
      storagePath,
      file,
      {
        contentType: file.type,
        upsert: false,
      }
    );

    if (uploadError) {
      return { data: null, fieldErrors: {}, error: SAFE_UPLOAD_ERROR };
    }

    const { data: urlData } = storageBucket.getPublicUrl(storagePath);
    const publicUrl = (urlData?.publicUrl || "").trim();

    if (!publicUrl || !isValidHttpUrl(publicUrl)) {
      return { data: null, fieldErrors: {}, error: SAFE_UPLOAD_ERROR };
    }

    const recordPayload = {
      label,
      category,
      bucket_name: MEDIA_BUCKET,
      storage_path: storagePath,
      public_url: publicUrl,
      mime_type: file.type,
      size_bytes: file.size,
      status: "active",
    };

    const { data: createdRecord, error: insertError } = await client
      .from("media_assets")
      .insert(recordPayload)
      .select(MEDIA_COLUMNS)
      .single();

    if (insertError || !createdRecord) {
      return { data: null, fieldErrors: {}, error: SAFE_UPLOAD_ERROR };
    }

    return { data: createdRecord, fieldErrors: {}, error: null };
  } catch {
    return { data: null, fieldErrors: {}, error: SAFE_UPLOAD_ERROR };
  }
}

export async function archiveMediaAsset(id, client = supabase) {
  if (!id) {
    return { data: null, error: "Asset ID is required to archive." };
  }

  if (!client) {
    return { data: null, error: SAFE_CONFIG_ERROR };
  }

  try {
    const { data, error } = await client
      .from("media_assets")
      .update({ status: "archived" })
      .eq("id", id)
      .select(MEDIA_COLUMNS)
      .single();

    if (error || !data) {
      return { data: null, error: SAFE_ARCHIVE_ERROR };
    }

    return { data, error: null };
  } catch {
    return { data: null, error: SAFE_ARCHIVE_ERROR };
  }
}

export async function applyAssetAsBrandLogo(asset, client = supabase) {
  if (!asset?.public_url || !isValidHttpUrl(asset.public_url)) {
    return { error: "Selected asset does not have a valid public URL." };
  }

  const currentSettings = await fetchAdminSiteSettings(client);
  const nextBrand = {
    ...currentSettings.brand,
    logo_url: asset.public_url,
  };

  const saveResult = await saveBrandSettings(nextBrand, client);
  if (saveResult.error) {
    return { error: saveResult.error };
  }
  return { data: saveResult.data, error: null };
}


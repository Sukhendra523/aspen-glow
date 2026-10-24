import { createClient } from "@supabase/supabase-js";

let clientInstance = null;

function validateUrl(url) {
  if (!url || typeof url !== "string") return false;
  if (url === "https://your-project-id.supabase.co") return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function isSupabaseConfigured() {
  if (clientInstance) return true;
  const envUrl = (process.env.REACT_APP_SUPABASE_URL || "").trim();
  const envKey = (process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY || "").trim();
  return Boolean(envUrl && envKey && validateUrl(envUrl));
}

export function initSupabase(url, anonKey) {
  const cleanUrl = String(url || "").trim();
  const cleanKey = String(anonKey || "").trim();
  if (!cleanUrl || !cleanKey || !validateUrl(cleanUrl)) {
    return null;
  }
  clientInstance = createClient(cleanUrl, cleanKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return clientInstance;
}

// In local development or testing with .env, initialize immediately if available
const localUrl = (process.env.REACT_APP_SUPABASE_URL || "").trim();
const localKey = (process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY || "").trim();
if (validateUrl(localUrl) && localKey && localKey !== "your-public-anon-key") {
  initSupabase(localUrl, localKey);
}

export function getSupabaseClient() {
  return clientInstance;
}

export async function fetchRuntimeConfig() {
  if (clientInstance) {
    return clientInstance;
  }
  try {
    const response = await fetch("/api/config");
    if (response.ok) {
      const data = await response.json();
      if (data?.supabaseUrl && data?.supabaseAnonKey) {
        return initSupabase(data.supabaseUrl, data.supabaseAnonKey);
      }
    }
  } catch {
    // static or offline fallback
  }
  return clientInstance;
}

export const supabase = new Proxy(
  {},
  {
    get(_target, prop) {
      if (!clientInstance) return undefined;
      const value = clientInstance[prop];
      return typeof value === "function" ? value.bind(clientInstance) : value;
    },
  }
);

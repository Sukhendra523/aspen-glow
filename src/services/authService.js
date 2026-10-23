import { supabase } from "../lib/supabaseClient";

const SAFE_CONFIG_ERROR =
  "Backend configuration is missing. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_PUBLISHABLE_KEY.";
const SAFE_AUTH_ERROR = "Invalid email or password.";
const SAFE_UNAUTHORIZED_ERROR =
  "Access denied. This account is not authorized as an active administrator.";
const SAFE_GENERIC_ERROR =
  "Unable to complete the request right now. Please try again.";

export function isActiveAdminProfile(profile) {
  return Boolean(
    profile && profile.role === "admin" && profile.status === "active"
  );
}

export function getSafeResetRedirectUrl(origin) {
  const baseOrigin =
    origin || (typeof window !== "undefined" ? window.location.origin : "");
  try {
    const url = new URL("/admin/reset-password", baseOrigin);
    if (url.origin !== baseOrigin) {
      return `${baseOrigin}/admin/reset-password`;
    }
    return url.toString();
  } catch {
    return "/admin/reset-password";
  }
}

export async function fetchAdminProfile(userId, client = supabase) {
  if (!client) {
    return { profile: null, isAdmin: false, error: SAFE_CONFIG_ERROR };
  }
  if (!userId) {
    return { profile: null, isAdmin: false, error: null };
  }

  try {
    const { data, error } = await client
      .from("profiles")
      .select("id, email, display_name, role, status")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      return { profile: null, isAdmin: false, error: SAFE_GENERIC_ERROR };
    }

    const isAdmin = isActiveAdminProfile(data);
    return {
      profile: data || null,
      isAdmin,
      error: isAdmin ? null : SAFE_UNAUTHORIZED_ERROR,
    };
  } catch {
    return { profile: null, isAdmin: false, error: SAFE_GENERIC_ERROR };
  }
}

export async function getInitialAuthState(client = supabase) {
  if (!client) {
    return { session: null, profile: null, isAdmin: false, error: null };
  }

  try {
    const { data, error } = await client.auth.getSession();
    if (error || !data?.session?.user) {
      return { session: null, profile: null, isAdmin: false, error: null };
    }

    const { profile, isAdmin } = await fetchAdminProfile(
      data.session.user.id,
      client
    );
    if (!isAdmin) {
      await client.auth.signOut();
      return { session: null, profile: null, isAdmin: false, error: null };
    }

    return {
      session: data.session,
      profile,
      isAdmin: true,
      error: null,
    };
  } catch {
    return { session: null, profile: null, isAdmin: false, error: null };
  }
}

export async function signInAdmin({ email, password }, client = supabase) {
  if (!client) {
    return {
      session: null,
      profile: null,
      isAdmin: false,
      error: SAFE_CONFIG_ERROR,
    };
  }

  const trimmedEmail = (email || "").trim();
  if (!trimmedEmail || !password) {
    return {
      session: null,
      profile: null,
      isAdmin: false,
      error: "Email and password are required.",
    };
  }

  try {
    const { data, error } = await client.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    if (error || !data?.session?.user) {
      return {
        session: null,
        profile: null,
        isAdmin: false,
        error: SAFE_AUTH_ERROR,
      };
    }

    const profileResult = await fetchAdminProfile(data.session.user.id, client);
    if (!profileResult.isAdmin) {
      await client.auth.signOut();
      return {
        session: null,
        profile: null,
        isAdmin: false,
        error: SAFE_UNAUTHORIZED_ERROR,
      };
    }

    return {
      session: data.session,
      profile: profileResult.profile,
      isAdmin: true,
      error: null,
    };
  } catch {
    return {
      session: null,
      profile: null,
      isAdmin: false,
      error: SAFE_GENERIC_ERROR,
    };
  }
}

export async function signOutAdmin(client = supabase) {
  if (!client) {
    return { error: null };
  }
  try {
    const { error } = await client.auth.signOut();
    return { error: error ? SAFE_GENERIC_ERROR : null };
  } catch {
    return { error: SAFE_GENERIC_ERROR };
  }
}

export async function requestAdminPasswordReset(email, client = supabase) {
  if (!client) {
    return { ok: false, error: SAFE_CONFIG_ERROR };
  }

  const trimmedEmail = (email || "").trim();
  if (!trimmedEmail) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  try {
    const redirectTo = getSafeResetRedirectUrl();
    await client.auth.resetPasswordForEmail(trimmedEmail, { redirectTo });
    // Always return generic success to avoid account enumeration
    return { ok: true, error: null };
  } catch {
    return { ok: false, error: SAFE_GENERIC_ERROR };
  }
}

export async function updateAdminPassword(newPassword, client = supabase) {
  if (!client) {
    return { ok: false, error: SAFE_CONFIG_ERROR };
  }

  if (!newPassword || newPassword.length < 8) {
    return {
      ok: false,
      error: "Password must be at least 8 characters long.",
    };
  }

  try {
    const { error } = await client.auth.updateUser({ password: newPassword });
    if (error) {
      return {
        ok: false,
        error:
          "Unable to update password. Your reset link may have expired or is invalid.",
      };
    }
    return { ok: true, error: null };
  } catch {
    return { ok: false, error: SAFE_GENERIC_ERROR };
  }
}


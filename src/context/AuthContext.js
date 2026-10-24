import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  supabase,
  isSupabaseConfigured,
  getSupabaseClient,
  fetchRuntimeConfig,
} from "../lib/supabaseClient";
import {
  getInitialAuthState,
  fetchAdminProfile,
  signInAdmin,
  signOutAdmin,
  requestAdminPasswordReset,
  updateAdminPassword,
} from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children, client: propClient }) {
  const [activeClient, setActiveClient] = useState(
    propClient !== undefined
      ? propClient
      : getSupabaseClient() || (isSupabaseConfigured() ? supabase : null)
  );
  const [configChecked, setConfigChecked] = useState(
    propClient !== undefined || Boolean(getSupabaseClient())
  );
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recoveryMode, setRecoveryMode] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (propClient !== undefined) {
      setActiveClient(propClient);
      setConfigChecked(true);
      return undefined;
    }
    const current = getSupabaseClient();
    if (current) {
      setActiveClient(current);
      setConfigChecked(true);
      return undefined;
    }
    fetchRuntimeConfig().then((loaded) => {
      if (!isMounted) return;
      if (loaded) {
        setActiveClient(loaded);
      }
      setConfigChecked(true);
    });
    return () => {
      isMounted = false;
    };
  }, [propClient]);

  useEffect(() => {
    let isMounted = true;

    if (!configChecked) {
      return undefined;
    }

    if (!activeClient) {
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    getInitialAuthState(activeClient).then((result) => {
      if (!isMounted) return;
      setSession(result.session);
      setProfile(result.profile);
      setIsAdmin(result.isAdmin);
      setLoading(false);
    });

    const subscriptionData = activeClient.auth?.onAuthStateChange
      ? activeClient.auth.onAuthStateChange(async (event, nextSession) => {
          if (!isMounted) return;

          if (event === "PASSWORD_RECOVERY") {
            setRecoveryMode(true);
            setSession(nextSession);
            setLoading(false);
            return;
          }

          if (!nextSession?.user) {
            setSession(null);
            setProfile(null);
            setIsAdmin(false);
            setRecoveryMode(false);
            setLoading(false);
            return;
          }

          const profileResult = await fetchAdminProfile(
            nextSession.user.id,
            activeClient
          );
          if (!isMounted) return;

          if (profileResult.isAdmin) {
            setSession(nextSession);
            setProfile(profileResult.profile);
            setIsAdmin(true);
          } else {
            setSession(null);
            setProfile(null);
            setIsAdmin(false);
          }
          setLoading(false);
        })
      : null;

    return () => {
      isMounted = false;
      subscriptionData?.data?.subscription?.unsubscribe?.();
    };
  }, [activeClient, configChecked]);

  const login = useCallback(
    async ({ email, password }) => {
      const result = await signInAdmin({ email, password }, activeClient);
      if (result.isAdmin) {
        setSession(result.session);
        setProfile(result.profile);
        setIsAdmin(true);
      } else {
        setSession(null);
        setProfile(null);
        setIsAdmin(false);
      }
      return result;
    },
    [activeClient]
  );

  const logout = useCallback(async () => {
    const result = await signOutAdmin(activeClient);
    setSession(null);
    setProfile(null);
    setIsAdmin(false);
    setRecoveryMode(false);
    return result;
  }, [activeClient]);

  const sendPasswordReset = useCallback(
    async (email) => requestAdminPasswordReset(email, activeClient),
    [activeClient]
  );

  const changePassword = useCallback(
    async (newPassword) => {
      const result = await updateAdminPassword(newPassword, activeClient);
      if (result.ok) {
        setRecoveryMode(false);
      }
      return result;
    },
    [activeClient]
  );

  const value = useMemo(
    () => ({
      client: activeClient,
      configured: Boolean(activeClient) || isSupabaseConfigured(),
      session,
      user: session?.user || null,
      profile,
      isAdmin,
      loading,
      recoveryMode,
      login,
      logout,
      sendPasswordReset,
      changePassword,
    }),
    [
      activeClient,
      session,
      profile,
      isAdmin,
      loading,
      recoveryMode,
      login,
      logout,
      sendPasswordReset,
      changePassword,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}


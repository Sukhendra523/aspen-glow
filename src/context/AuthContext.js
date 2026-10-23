import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import {
  getInitialAuthState,
  fetchAdminProfile,
  signInAdmin,
  signOutAdmin,
  requestAdminPasswordReset,
  updateAdminPassword,
} from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children, client = supabase }) {
  const configured = Boolean(client) || isSupabaseConfigured();
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(Boolean(client));
  const [recoveryMode, setRecoveryMode] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (!client) {
      setLoading(false);
      return undefined;
    }

    getInitialAuthState(client).then((result) => {
      if (!isMounted) return;
      setSession(result.session);
      setProfile(result.profile);
      setIsAdmin(result.isAdmin);
      setLoading(false);
    });

    const { data: subscriptionData } = client.auth.onAuthStateChange(
      async (event, nextSession) => {
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
          client
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
      }
    );

    return () => {
      isMounted = false;
      subscriptionData?.subscription?.unsubscribe?.();
    };
  }, [client]);

  const login = useCallback(
    async ({ email, password }) => {
      const result = await signInAdmin({ email, password }, client);
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
    [client]
  );

  const logout = useCallback(async () => {
    const result = await signOutAdmin(client);
    setSession(null);
    setProfile(null);
    setIsAdmin(false);
    setRecoveryMode(false);
    return result;
  }, [client]);

  const sendPasswordReset = useCallback(
    async (email) => requestAdminPasswordReset(email, client),
    [client]
  );

  const changePassword = useCallback(
    async (newPassword) => {
      const result = await updateAdminPassword(newPassword, client);
      if (result.ok) {
        setRecoveryMode(false);
      }
      return result;
    },
    [client]
  );

  const value = useMemo(
    () => ({
      client,
      configured,
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
      client,
      configured,
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


// lib/hooks/AuthProvider.tsx — Singleton auth context so auth is fetched ONCE at root
// and shared across all editors. Switching document types never re-triggers auth.
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthContextValue>({
    user: null,
    loading: true,
  });

  useEffect(() => {
    const supabase = createBrowserClient();

    // Get initial user (single network call for the entire app lifetime)
    supabase.auth.getUser().then(({ data: { user } }) => {
      setState({ user, loading: false });
    });

    // Listen for auth changes (sign-in, sign-out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ user: session?.user ?? null, loading: false });
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
  );
}

/** Read auth from the root-level AuthProvider context — zero network calls */
export function useAuthContext(): AuthContextValue {
  return useContext(AuthContext);
}

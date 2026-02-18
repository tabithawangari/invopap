// lib/hooks/useAuth.ts — Client-side auth state hook
// Reads from the root-level AuthProvider context for zero-cost re-renders.
// Auth is fetched ONCE when the app mounts; switching document types is instant.
"use client";

import { useAuthContext } from "@/lib/hooks/AuthProvider";
import type { User } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  loading: boolean;
}

export function useAuth(): AuthState {
  return useAuthContext();
}

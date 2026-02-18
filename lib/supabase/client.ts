"use client";

import { createBrowserClient as _createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

export function createClient() {
  return _createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Re-export with the name consumers expect
export const createBrowserClient = createClient;

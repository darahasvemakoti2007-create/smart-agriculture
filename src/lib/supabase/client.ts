import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a Supabase client for use in browser/client components.
 *
 * This client runs in the user's browser and uses the PUBLIC
 * Supabase URL and publishable (anon) key — both are safe to expose
 * because Row Level Security (RLS) on the database controls what
 * each user can actually read or write.
 *
 * Usage (inside a 'use client' component):
 *   import { createClient } from "@/src/lib/supabase/client";
 *   const supabase = createClient();
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Creates a Supabase client for use in server-side code:
 *   - Server Components
 *   - Route Handlers (app/api/...)
 *   - Server Actions
 *
 * This client reads and writes authentication cookies so that
 * sessions are shared between the server and the browser.
 *
 * It uses the same PUBLIC URL and publishable key as the browser
 * client — NOT the service-role key. This means it still respects
 * Row Level Security (RLS) and operates under the logged-in user's
 * permissions, which is the safest default.
 *
 * Usage (inside a server component or route handler):
 *   import { createClient } from "@/src/lib/supabase/server";
 *   const supabase = await createClient();
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // Server Components cannot set cookies — this is expected.
            // If you have middleware that refreshes user sessions,
            // this catch block can safely be ignored.
          }
        },
      },
    }
  );
}

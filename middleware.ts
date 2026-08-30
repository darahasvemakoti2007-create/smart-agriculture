import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Supabase Auth Middleware
 *
 * WHY THIS FILE IS NEEDED:
 * Supabase stores authentication tokens in cookies. These tokens expire.
 * This middleware runs BEFORE every page request and does two things:
 *   1. Refreshes the auth session (extends the cookie if it's about to expire)
 *   2. Redirects unauthenticated users away from protected routes
 *
 * Without this, a user could appear "logged out" even though their session
 * is still valid — the cookie just needs to be refreshed.
 */
export async function middleware(request: NextRequest) {
  // Start with a "pass-through" response — let the request continue as normal
  let supabaseResponse = NextResponse.next({ request });

  // Create a Supabase client that can read/write cookies on the request & response
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // 1. Set cookies on the incoming request (so server components see them)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // 2. Create a fresh response that carries the updated request
          supabaseResponse = NextResponse.next({ request });
          // 3. Set cookies on the outgoing response (so the browser receives them)
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session — this is the critical call.
  // IMPORTANT: Do NOT remove this line. Do NOT use getSession() here.
  // getUser() actually contacts the Supabase Auth server to validate the token,
  // whereas getSession() only reads from the cookie without validation.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // --- Route protection ---

  // If user is NOT logged in and tries to access /dashboard (or any sub-route),
  // redirect them to /login.
  if (!user && pathname.startsWith("/dashboard")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // If user IS logged in and tries to visit /login or /register,
  // redirect them to /dashboard (they're already authenticated).
  if (user && (pathname === "/login" || pathname === "/register")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

// Tell Next.js which routes this middleware should run on.
// We exclude static files and internal Next.js routes for performance.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

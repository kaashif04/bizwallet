import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

// Route protection + session refresh.
//
//  - Unauthenticated users hitting a protected area  -> /login
//  - A 'customer' trying to open /admin/*            -> /customer
//  - An 'owner' trying to open /customer/*           -> /admin
//
// Role comes from public.members (RLS lets a user read their own row). For a
// high-traffic app you'd promote `role` into a JWT custom claim to avoid this
// per-request lookup, but a single indexed query is fine for now.
export async function middleware(request: NextRequest) {
  // Start with a passthrough response we can attach refreshed cookies to.
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[]
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: getUser() revalidates the token with Supabase (don't trust
  // getSession() in middleware) and refreshes cookies via setAll above.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAdminArea = path.startsWith("/admin");
  const isCustomerArea = path.startsWith("/customer");

  // Not signed in -> bounce to login (remembering where they wanted to go).
  if ((isAdminArea || isCustomerArea) && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", path);
    return NextResponse.redirect(loginUrl);
  }

  // Only the ADMIN area is role-gated. The customer area is open to any signed-in
  // user, so an owner can also shop as their own customer.
  if (user && isAdminArea) {
    const { data: profile } = await supabase
      .from("members")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "owner") {
      return NextResponse.redirect(new URL("/customer/dashboard", request.url));
    }
  }

  return response;
}

export const config = {
  // Run on everything except Next internals and static assets.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

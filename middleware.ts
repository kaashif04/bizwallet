import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

// Route protection + session refresh.
//
//  - Signed out on /customer/* or /                  -> /login
//  - Signed-in member on / or /login                 -> dashboard (or ?redirect)
//  - Signed in without a member row (BizPos staff)   -> /login?account=staff
//
// BizWallet is customer-only; managers use the BizPos dashboard.
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
  const isCustomerArea = path.startsWith("/customer");

  // A redirect is a new response: carry over any cookies getUser() just
  // refreshed, or the browser keeps a spent refresh token and gets signed out.
  const redirectTo = (to: string) => {
    const res = NextResponse.redirect(new URL(to, request.url));
    response.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  };

  // Not signed in -> bounce to login (remembering where they wanted to go).
  if (!user) {
    if (isCustomerArea) return redirectTo(`/login?redirect=${encodeURIComponent(path)}`);
    if (path === "/") return redirectTo("/login");
    return response;
  }

  // Signed in: skip the login screen. One login serves every Biz app, so a
  // BizPos staff account (no member row) gets an explanation instead.
  if (isCustomerArea || path === "/" || path === "/login") {
    const { data: member } = await supabase
      .from("members")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();
    if (!member) {
      return path === "/login" ? response : redirectTo("/login?account=staff");
    }
    if (path === "/" || path === "/login") {
      const next = request.nextUrl.searchParams.get("redirect");
      return redirectTo(next?.startsWith("/") && !next.startsWith("//") ? next : "/customer/dashboard");
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

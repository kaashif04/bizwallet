import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

// Route protection + session refresh.
//
//  - Signed out on /customer/*                       -> /login
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

  // Not signed in -> bounce to login (remembering where they wanted to go).
  if (isCustomerArea && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", path);
    return NextResponse.redirect(loginUrl);
  }

  // One login for every Biz app: a staff account has no member row here.
  if (user && isCustomerArea) {
    const { data: member } = await supabase
      .from("members")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();
    if (!member) {
      return NextResponse.redirect(new URL("/login?account=staff", request.url));
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

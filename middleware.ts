import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      const url = new URL("/login", request.url);
      url.searchParams.set("callbackUrl", request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    const pathname = request.nextUrl.pathname;
    const userRoleRaw = typeof token.role === "number" ? token.role : Number(token.role ?? 0);
    const isAdmin = Number.isFinite(userRoleRaw) && userRoleRaw >= 2;
    const isDashboardRoute = pathname.startsWith("/dashboard");
    const isDashboardPostsRoute = pathname.startsWith("/dashboard/posts");
    const isApiRoute = pathname.startsWith("/api/admin");
    const isPostsApiRoute = pathname.startsWith("/api/admin/posts");

    if (!isAdmin) {
      if (pathname === "/dashboard") {
        const postsUrl = new URL("/dashboard/posts", request.url);
        return NextResponse.redirect(postsUrl);
      }

      if (isDashboardRoute && !isDashboardPostsRoute) {
        const postsUrl = new URL("/dashboard/posts", request.url);
        return NextResponse.redirect(postsUrl);
      }

      if (isApiRoute && !isPostsApiRoute) {
        return NextResponse.json(
          { message: "Bu əməliyyat üçün icazəniz yoxdur." },
          { status: 403 },
        );
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    const url = new URL("/login", request.url);
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/admin/:path*"],
};


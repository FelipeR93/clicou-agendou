import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";
import type { Role } from "@/generated/prisma/client";

const { auth } = NextAuth(authConfig);

function getUserRole(session: { user?: { role?: Role } } | null): Role | undefined {
  return session?.user?.role;
}

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session?.user;
  const pathname = nextUrl.pathname;

  const isPublicRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth");

  if (isPublicRoute) {
    if (isLoggedIn && pathname === "/login") {
      const role = getUserRole(session);
      if (role === "ADMIN") return NextResponse.redirect(new URL("/admin/dashboard", nextUrl));
      if (role === "PROFESSIONAL") return NextResponse.redirect(new URL("/profissional/agenda", nextUrl));
      if (role === "RESPONSIBLE") return NextResponse.redirect(new URL("/responsavel/agenda", nextUrl));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${encodeURIComponent(pathname)}`, nextUrl)
    );
  }

  const role = getUserRole(session);

  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return new NextResponse("Acesso negado", { status: 403 });
  }
  if (pathname.startsWith("/profissional") && role !== "PROFESSIONAL") {
    return new NextResponse("Acesso negado", { status: 403 });
  }
  if (pathname.startsWith("/responsavel") && role !== "RESPONSIBLE") {
    return new NextResponse("Acesso negado", { status: 403 });
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};

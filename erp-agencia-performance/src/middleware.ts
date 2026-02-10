import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

const publicRoutes = ["/login", "/registro"]

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isAuthenticated = !!req.auth

  // Allow public routes and API auth routes
  if (
    publicRoutes.includes(pathname) ||
    pathname.startsWith("/api/auth")
  ) {
    // Redirect to dashboard if already authenticated and visiting login/registro
    if (isAuthenticated && publicRoutes.includes(pathname)) {
      return NextResponse.redirect(new URL("/", req.url))
    }
    return NextResponse.next()
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)"],
}

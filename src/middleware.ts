import { NextRequest, NextResponse } from "next/server"

const PROTECTED = ["/dashboard"]
const AUTH_ONLY = ["/login", "/register"]

export function middleware(req: NextRequest) {
  const token = req.cookies.get("auth-token")?.value
  const path = req.nextUrl.pathname

  if (PROTECTED.some(p => path.startsWith(p)) && !token) {
    return NextResponse.redirect(new URL("/login", req.url))
  }
  if (AUTH_ONLY.some(p => path.startsWith(p)) && token) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }
  return NextResponse.next()
}

export const config = { matcher: ["/dashboard/:path*", "/login", "/register"] }
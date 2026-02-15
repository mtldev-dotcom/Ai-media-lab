import { type NextRequest, NextResponse } from 'next/server'

// List of public routes that don't require authentication
const publicRoutes = ['/login', '/signup', '/']

// List of routes that require authentication
const protectedRoutes = ['/projects', '/generate', '/analytics', '/settings']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if route is public
  const isPublicRoute = publicRoutes.includes(pathname)
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Check if route requires auth
  const requiresAuth = protectedRoutes.some((route) => pathname.startsWith(route))

  if (!requiresAuth) {
    return NextResponse.next()
  }

  // Get the session token from cookies
  const token = request.cookies.get('sb-access-token')?.value

  // If no token and route requires auth, redirect to login
  if (!token && requiresAuth) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}

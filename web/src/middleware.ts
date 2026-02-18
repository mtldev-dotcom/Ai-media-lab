import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

// List of public routes that don't require authentication
const publicRoutes = ['/login', '/signup', '/']

// List of routes that require authentication
const protectedRoutes = ['/projects', '/generate', '/analytics', '/settings']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if route requires auth
  const isAuthRoute = pathname === '/login' || pathname === '/signup'
  const requiresAuth = protectedRoutes.some((route) => pathname.startsWith(route))

  // For routes that don't need auth checks, pass through
  if (!isAuthRoute && !requiresAuth) {
    return NextResponse.next()
  }

  // Create a response object
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create Supabase client with proper cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If logged in and on auth page, redirect to projects
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/projects', request.url))
  }

  // If no user and route requires auth, redirect to login
  if (!user && requiresAuth) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
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

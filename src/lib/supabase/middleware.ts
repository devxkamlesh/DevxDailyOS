import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/signup', '/maintenance']
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(route)
  )

  // Admin routes protection
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  const allowedAdminEmails = (process.env.ALLOWED_ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase())
  const userEmail = user?.email?.toLowerCase() || ''
  const isAdmin = allowedAdminEmails.includes(userEmail)

  // Check maintenance mode (skip for admins and public routes)
  if (!isAdmin && !isPublicRoute && request.nextUrl.pathname !== '/maintenance') {
    try {
      const { data: settings } = await supabase
        .from('system_settings')
        .select('maintenance_mode')
        .single()
      
      if (settings?.maintenance_mode) {
        const url = request.nextUrl.clone()
        url.pathname = '/maintenance'
        return NextResponse.redirect(url)
      }
    } catch (e) {
      // If settings table doesn't exist, continue normally
    }
  }

  if (isAdminRoute) {
    // Must be logged in - redirect to login if not authenticated
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    
    // Let the admin layout handle authorization check and show access denied page
    // No redirect needed here - the layout will handle unauthorized users
  }

  // Redirect to login if not authenticated and trying to access protected route
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect to dashboard if authenticated and trying to access login/signup
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

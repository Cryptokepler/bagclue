import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { SessionData } from '@/lib/session'
import { createClient } from '@supabase/supabase-js'

const sessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long_bagclue_2026',
  cookieName: 'bagclue_admin_session'
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Proteger todas las rutas /admin excepto /admin/login
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') {
      return NextResponse.next()
    }

    // Verificar sesión admin
    const response = NextResponse.next()
    const session = await getIronSession<SessionData>(request, response, sessionOptions)

    if (!session.isLoggedIn) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  // /account routes: let client-side handle auth
  // Implicit flow stores tokens in localStorage (not cookies)
  // Client-side will redirect to /account/login if not authenticated
  // Middleware should not block these routes
  if (pathname.startsWith('/account')) {
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*']
}

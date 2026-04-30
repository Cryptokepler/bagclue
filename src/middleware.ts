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

  // Proteger todas las rutas /account excepto /account/login
  if (pathname.startsWith('/account')) {
    if (pathname === '/account/login') {
      return NextResponse.next()
    }

    // Verificar autenticación de cliente con Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false
      }
    })

    // Obtener token de las cookies
    const accessToken = request.cookies.get('sb-access-token')?.value
    const refreshToken = request.cookies.get('sb-refresh-token')?.value

    if (!accessToken && !refreshToken) {
      return NextResponse.redirect(new URL('/account/login', request.url))
    }

    // Verificar que el token sea válido
    if (accessToken) {
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      
      if (error || !user) {
        return NextResponse.redirect(new URL('/account/login', request.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/account/:path*']
}

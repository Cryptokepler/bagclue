import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import bcrypt from 'bcryptjs'

const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '$2a$10$YourHashHere' // Cambiar en producción

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json({ error: 'Password requerido' }, { status: 400 })
    }

    // Verificar password
    const isValid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH)

    if (!isValid) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    // Crear sesión
    const session = await getSession()
    session.isLoggedIn = true
    session.username = 'admin'
    await session.save()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

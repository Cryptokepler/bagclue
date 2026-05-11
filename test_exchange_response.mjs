// Verificar qué retorna exchangeCodeForSession según docs Supabase

console.log(`
exchangeCodeForSession() retorna:
{
  data: {
    session: Session | null,
    user: User | null
  },
  error: AuthError | null
}

Session contiene:
- access_token
- refresh_token
- user: User object

Entonces SÍ retorna el user.
`)

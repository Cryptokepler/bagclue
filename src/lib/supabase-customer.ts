import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Singleton Supabase client for customer authentication
 * Browser-compatible with localStorage
 * 
 * IMPORTANT: This is the ONLY client that should be used in 'use client' components
 * to avoid "Multiple GoTrueClient instances" errors.
 * 
 * OAuth flow uses /api/auth/callback for code exchange, not hash-based detection.
 */
export const supabaseCustomer = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // Disabled - we use /api/auth/callback instead
    flowType: 'pkce', // Use PKCE flow for OAuth (more secure)
  },
})

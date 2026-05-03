/**
 * DEPRECATED - Use @/lib/supabase-customer instead
 * This file maintained for backward compatibility only
 * 
 * Importing this in 'use client' components creates multiple
 * GoTrueClient instances. Use supabaseCustomer for all client-side auth.
 */
import { supabaseCustomer } from './supabase-customer'

export const supabase = supabaseCustomer

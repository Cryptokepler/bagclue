/**
 * CRON Endpoint: Welcome Email Delivery
 * 
 * Purpose: Reliable delivery of welcome emails to new customers
 * Security: Protected by CRON_SECRET in Authorization header
 * Schedule: Every 5 minutes (configurable in vercel.json)
 * 
 * Flow:
 * 1. Query customer_profiles WHERE welcome_email_sent_at IS NULL
 * 2. Filter recent users (created < 24h ago)
 * 3. Send welcome email to each
 * 4. Mark welcome_email_sent_at = NOW() on success
 * 5. Log failures without breaking execution
 * 
 * Strategy: Fire-and-forget with explicit success tracking
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendWelcomeEmail } from '@/lib/email/mailer'

// Service role client for admin queries (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * CRON secret validation
 */
function isAuthorized(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error('[Welcome Email CRON] CRON_SECRET not configured')
    return false
  }

  if (!authHeader) {
    return false
  }

  // Expected format: "Bearer <secret>"
  const token = authHeader.replace(/^Bearer\s+/i, '')
  return token === cronSecret
}

/**
 * Process pending welcome emails
 */
async function processPendingWelcomeEmails() {
  const results = {
    total: 0,
    sent: 0,
    failed: 0,
    errors: [] as string[],
  }

  try {
    // Query customer_profiles with pending welcome emails
    // Filter: welcome_email_sent_at IS NULL, email IS NOT NULL, created < 24h ago
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { data: profiles, error } = await supabaseAdmin
      .from('customer_profiles')
      .select('id, user_id, email, name, created_at')
      .is('welcome_email_sent_at', null)
      .not('email', 'is', null)
      .gte('created_at', twentyFourHoursAgo)
      .order('created_at', { ascending: true })
      .limit(20) // Process max 20 per execution to avoid long-running lambda

    if (error) {
      console.error('[Welcome Email CRON] Query error:', error.message)
      return { error: 'Database query failed', results }
    }

    if (!profiles || profiles.length === 0) {
      console.log('[Welcome Email CRON] No pending welcome emails')
      return { success: true, results }
    }

    console.log(`[Welcome Email CRON] Processing ${profiles.length} pending welcome emails`)
    results.total = profiles.length

    // Process each profile
    for (const profile of profiles) {
      try {
        console.log(`[Welcome Email CRON] Sending to ${profile.email} (profile ${profile.id})`)

        // Send welcome email
        const success = await sendWelcomeEmail({
          to: profile.email,
          customerName: profile.name || undefined,
        })

        if (success) {
          // Mark as sent
          const { error: updateError } = await supabaseAdmin
            .from('customer_profiles')
            .update({ welcome_email_sent_at: new Date().toISOString() })
            .eq('id', profile.id)

          if (updateError) {
            console.error(`[Welcome Email CRON] Failed to mark as sent for ${profile.email}:`, updateError.message)
            results.failed++
            results.errors.push(`Update failed: ${profile.email}`)
          } else {
            console.log(`[Welcome Email CRON] ✅ Sent and marked: ${profile.email}`)
            results.sent++
          }
        } else {
          console.error(`[Welcome Email CRON] ❌ Send failed: ${profile.email}`)
          results.failed++
          results.errors.push(`Send failed: ${profile.email}`)
        }
      } catch (err: any) {
        console.error(`[Welcome Email CRON] Unexpected error for ${profile.email}:`, err.message)
        results.failed++
        results.errors.push(`Exception: ${profile.email}`)
        // Continue processing other profiles
      }
    }

    console.log(`[Welcome Email CRON] Completed: ${results.sent} sent, ${results.failed} failed`)
    return { success: true, results }

  } catch (err: any) {
    console.error('[Welcome Email CRON] Fatal error:', err.message)
    return { error: 'Fatal error', results }
  }
}

/**
 * GET handler for CRON execution
 */
export async function GET(req: NextRequest) {
  // Validate authorization
  if (!isAuthorized(req)) {
    console.warn('[Welcome Email CRON] Unauthorized request')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('[Welcome Email CRON] Authorized request received')

  // Process pending emails
  const result = await processPendingWelcomeEmails()

  return NextResponse.json(result, { status: 200 })
}

/**
 * POST handler (same as GET)
 */
export async function POST(req: NextRequest) {
  return GET(req)
}

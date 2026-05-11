import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/email/mailer'

/**
 * Test endpoint for Welcome Email
 * Solo para diagnóstico — BORRAR después de testing
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')
  
  if (!email) {
    return NextResponse.json({ error: 'Missing email parameter' }, { status: 400 })
  }

  console.log(`[Test Email] Attempting to send welcome email to: ${email}`)
  
  try {
    const success = await sendWelcomeEmail({
      to: email,
      customerName: 'Test User',
    })
    
    if (success) {
      console.log(`[Test Email] ✅ Email sent successfully to ${email}`)
      return NextResponse.json({
        success: true,
        message: `Email sent successfully to ${email}`,
      })
    } else {
      console.error(`[Test Email] ❌ Email failed to send to ${email}`)
      return NextResponse.json({
        success: false,
        message: `Email failed to send. Check SMTP configuration.`,
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error(`[Test Email] ❌ Unexpected error:`, error.message)
    return NextResponse.json({
      success: false,
      message: `Unexpected error: ${error.message}`,
    }, { status: 500 })
  }
}

/**
 * TEST SMTP ENDPOINT - TEMPORAL
 * Requiere token secreto en header
 * ELIMINAR después de validar SMTP en production
 */

import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    // Verificar token secreto
    const authHeader = request.headers.get('x-test-token');
    const SECRET_TOKEN = 'bagclue-smtp-test-2026'; // Token temporal para test

    if (authHeader !== SECRET_TOKEN) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Obtener variables SMTP de environment
    const SMTP_HOST = process.env.SMTP_HOST;
    const SMTP_PORT = process.env.SMTP_PORT;
    const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
    const SMTP_USER = process.env.SMTP_USER;
    const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
    const SMTP_FROM_EMAIL = process.env.SMTP_FROM_EMAIL;
    const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME;

    // Verificar que todas las variables existen
    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD || !SMTP_FROM_EMAIL || !SMTP_FROM_NAME) {
      return NextResponse.json(
        {
          error: 'Missing SMTP configuration',
          config: {
            SMTP_HOST: !!SMTP_HOST,
            SMTP_PORT: !!SMTP_PORT,
            SMTP_USER: !!SMTP_USER,
            SMTP_PASSWORD: !!SMTP_PASSWORD,
            SMTP_FROM_EMAIL: !!SMTP_FROM_EMAIL,
            SMTP_FROM_NAME: !!SMTP_FROM_NAME,
          }
        },
        { status: 500 }
      );
    }

    // Crear transporter
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT),
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASSWORD,
      },
    });

    // Enviar email de prueba
    const info = await transporter.sendMail({
      from: `"${SMTP_FROM_NAME}" <${SMTP_FROM_EMAIL}>`,
      to: 'info@kepleragents.com',
      subject: '✅ Test SMTP Bagclue Production Environment',
      text: 'Este email confirma que SMTP está configurado correctamente en Vercel Production.',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: 'Inter', -apple-system, sans-serif;
              background-color: #FFFBF8;
              margin: 0;
              padding: 40px 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 12px;
              padding: 40px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            }
            h1 {
              font-family: 'Playfair Display', serif;
              color: #0B0B0B;
              font-size: 28px;
              margin-bottom: 20px;
            }
            p {
              color: #333;
              line-height: 1.6;
              margin-bottom: 16px;
            }
            .badge {
              display: inline-block;
              background: #E85A9A;
              color: white;
              padding: 8px 16px;
              border-radius: 6px;
              font-weight: 600;
              text-decoration: none;
              margin-top: 20px;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #F5F1ED;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✅ SMTP Production Test</h1>
            <p>Este email confirma que <strong>SMTP está configurado correctamente</strong> en Vercel Production Environment.</p>
            <p><strong>Validación exitosa:</strong></p>
            <ul>
              <li>✅ Variables SMTP disponibles</li>
              <li>✅ Conexión Hostinger exitosa</li>
              <li>✅ Email enviado desde production</li>
              <li>✅ Ready para emails transaccionales</li>
            </ul>
            <a href="https://bagclue.vercel.app" class="badge">Ver Bagclue</a>
            <div class="footer">
              <p><strong>Bagclue</strong> - Piezas de lujo auténticas<br>
              ${SMTP_FROM_EMAIL}</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      response: info.response,
      from: `${SMTP_FROM_NAME} <${SMTP_FROM_EMAIL}>`,
      to: 'info@kepleragents.com',
      message: 'Email sent successfully from production environment',
    });

  } catch (error: any) {
    console.error('SMTP Test Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to send email',
        message: error.message,
        code: error.code,
      },
      { status: 500 }
    );
  }
}

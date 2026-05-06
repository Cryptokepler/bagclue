/**
 * Email Mailer — Bagclue
 * Maneja envío de emails transaccionales vía SMTP Hostinger
 * NO lanza errores fatales si falla envío
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromEmail: string;
  fromName: string;
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

let transporter: Transporter | null = null;

/**
 * Obtiene configuración SMTP desde environment variables
 */
function getEmailConfig(): EmailConfig | null {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const secure = process.env.SMTP_SECURE === 'true';
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  const fromEmail = process.env.SMTP_FROM_EMAIL;
  const fromName = process.env.SMTP_FROM_NAME;

  // Si faltan variables, retornar null (no lanzar error)
  if (!host || !port || !user || !password || !fromEmail || !fromName) {
    console.warn('[Mailer] SMTP variables not configured. Email disabled.');
    return null;
  }

  return {
    host,
    port: parseInt(port),
    secure,
    user,
    password,
    fromEmail,
    fromName,
  };
}

/**
 * Inicializa transporter SMTP (lazy initialization)
 */
function getTransporter(): Transporter | null {
  if (transporter) return transporter;

  const config = getEmailConfig();
  if (!config) return null;

  try {
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.password,
      },
    });

    console.log('[Mailer] SMTP transporter initialized');
    return transporter;
  } catch (error) {
    console.error('[Mailer] Failed to initialize transporter:', error);
    return null;
  }
}

/**
 * Envía email transaccional
 * NO lanza error si falla — solo logea warning
 */
export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  const config = getEmailConfig();
  if (!config) {
    console.warn('[Mailer] Email not sent: SMTP not configured');
    return false;
  }

  const transport = getTransporter();
  if (!transport) {
    console.warn('[Mailer] Email not sent: transporter unavailable');
    return false;
  }

  try {
    const info = await transport.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: params.to,
      subject: params.subject,
      text: params.text || '',
      html: params.html,
    });

    console.log(`[Mailer] Email sent successfully to ${params.to} (ID: ${info.messageId})`);
    return true;
  } catch (error: any) {
    console.error(`[Mailer] Failed to send email to ${params.to}:`, error.message);
    return false;
  }
}

/**
 * Envía email de confirmación de compra
 */
export async function sendOrderConfirmationEmail(params: {
  to: string;
  customerName?: string;
  orderId: string;
  productName: string;
  totalAmount: number;
  currency: string;
  orderUrl: string;
}): Promise<boolean> {
  const { generateOrderConfirmationHTML } = await import('./templates/order-confirmation');
  
  const html = generateOrderConfirmationHTML({
    customerName: params.customerName || 'Cliente',
    orderId: params.orderId,
    productName: params.productName,
    totalAmount: params.totalAmount,
    currency: params.currency,
    orderUrl: params.orderUrl,
  });

  return sendEmail({
    to: params.to,
    subject: `✅ Confirmación de compra — Pedido #${params.orderId}`,
    html,
    text: `Tu compra ha sido confirmada. Pedido #${params.orderId}. Total: ${params.totalAmount} ${params.currency}.`,
  });
}

/**
 * Envía email de confirmación de apartado
 */
export async function sendLayawayConfirmationEmail(params: {
  to: string;
  customerName?: string;
  productName: string;
  totalPrice: number;
  amountPaid: number;
  remainingBalance: number;
  currency: string;
  accountUrl: string;
}): Promise<boolean> {
  const { generateLayawayConfirmationHTML } = await import('./templates/layaway-confirmation');
  
  const html = generateLayawayConfirmationHTML({
    customerName: params.customerName || 'Cliente',
    productName: params.productName,
    totalPrice: params.totalPrice,
    amountPaid: params.amountPaid,
    remainingBalance: params.remainingBalance,
    currency: params.currency,
    accountUrl: params.accountUrl,
  });

  return sendEmail({
    to: params.to,
    subject: '✅ Apartado confirmado — Bagclue',
    html,
    text: `Tu apartado ha sido confirmado. Producto: ${params.productName}. Pagado: ${params.amountPaid} ${params.currency}. Saldo: ${params.remainingBalance} ${params.currency}.`,
  });
}

/**
 * Envía email de tracking enviado
 */
export async function sendShippingTrackingEmail(params: {
  to: string;
  customerName?: string;
  orderId: string;
  productName: string;
  shippingProvider: string;
  trackingNumber: string;
  trackingUrl?: string;
  orderTrackingUrl: string;
}): Promise<boolean> {
  const { generateShippingTrackingHTML } = await import('./templates/shipping-tracking');
  
  const html = generateShippingTrackingHTML({
    customerName: params.customerName || 'Cliente',
    orderId: params.orderId,
    productName: params.productName,
    shippingProvider: params.shippingProvider,
    trackingNumber: params.trackingNumber,
    trackingUrl: params.trackingUrl,
    orderTrackingUrl: params.orderTrackingUrl,
  });

  return sendEmail({
    to: params.to,
    subject: `🚚 Tu pedido #${params.orderId} ha sido enviado`,
    html,
    text: `Tu pedido ha sido enviado. Paquetería: ${params.shippingProvider}. Tracking: ${params.trackingNumber}.`,
  });
}

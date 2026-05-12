/**
 * Template: Comprobante Rechazado
 * Trigger: admin reject, transaction.status = rejected
 */

interface BankTransferRejectedParams {
  customerName: string;
  orderId: string;
  productName: string;
  productBrand: string;
  paymentReference: string;
  rejectionReason: string;
  expiresAt: string | null;
  paymentUrl: string;
}

export function generateBankTransferRejectedHTML(params: BankTransferRejectedParams): string {
  // Calculate remaining time if expiresAt is provided
  let timeRemaining = '';
  if (params.expiresAt) {
    const expiryDate = new Date(params.expiresAt);
    const now = new Date();
    const hoursLeft = Math.max(0, Math.round((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60)));
    if (hoursLeft > 0) {
      timeRemaining = `Tienes ${hoursLeft} hora${hoursLeft > 1 ? 's' : ''} restantes para completar el pago.`;
    } else {
      timeRemaining = 'El plazo de pago ha expirado. Por favor, contacta a Bagclue si deseas realizar un nuevo pedido.';
    }
  }

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Comprobante Rechazado</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #FFFBF8;
      color: #0B0B0B;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    .logo {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 28px;
      letter-spacing: 0.3em;
      color: #0B0B0B;
      margin-bottom: 10px;
    }
    .card {
      background: white;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    h1 {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 24px;
      font-weight: 600;
      color: #0B0B0B;
      margin: 0 0 20px 0;
    }
    p {
      font-size: 16px;
      line-height: 1.6;
      color: #333;
      margin: 0 0 16px 0;
    }
    .status {
      background: #FEF3C7;
      color: #92400E;
      padding: 8px 16px;
      border-radius: 6px;
      display: inline-block;
      font-size: 14px;
      font-weight: 600;
      margin: 16px 0;
    }
    .detail {
      background: #F5F1ED;
      border-radius: 8px;
      padding: 20px;
      margin: 24px 0;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
      font-size: 15px;
    }
    .detail-row:last-child {
      margin-bottom: 0;
    }
    .detail-label {
      color: #666;
    }
    .detail-value {
      font-weight: 600;
      color: #0B0B0B;
    }
    .reason-box {
      background: #FEF3C7;
      border-left: 4px solid #F59E0B;
      padding: 16px 20px;
      margin: 20px 0;
      border-radius: 8px;
    }
    .reason-box p {
      margin: 0;
      color: #78350F;
      font-weight: 500;
    }
    .info-box {
      background: #FFF4F8;
      border-left: 4px solid #E85A9A;
      padding: 16px 20px;
      margin: 20px 0;
      border-radius: 8px;
    }
    .info-box p {
      margin: 0;
      color: #0B0B0B;
    }
    .button {
      display: inline-block;
      background: #E85A9A;
      color: white;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 15px;
      margin: 24px 0;
      text-align: center;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #E5E5E5;
      color: #666;
      font-size: 14px;
    }
    @media only screen and (max-width: 600px) {
      .container {
        padding: 20px 10px;
      }
      .card {
        padding: 24px;
      }
      h1 {
        font-size: 20px;
      }
      .button {
        display: block;
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">BAGCLUE</div>
    </div>
    
    <div class="card">
      <h1>⚠️ Necesitamos Revisar tu Comprobante</h1>
      
      <p>Hola ${params.customerName},</p>
      
      <p>No hemos podido validar tu comprobante de pago.</p>
      
      <div class="status">⏸ Revisión Necesaria</div>
      
      <div class="detail">
        <div class="detail-row">
          <span class="detail-label">Producto</span>
          <span class="detail-value">${params.productBrand} ${params.productName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Pedido</span>
          <span class="detail-value">#${params.orderId}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Referencia</span>
          <span class="detail-value">${params.paymentReference}</span>
        </div>
      </div>
      
      <div class="reason-box">
        <p><strong>Motivo:</strong> ${params.rejectionReason}</p>
      </div>
      
      <p>Por favor, revisa los datos de tu transferencia y sube un comprobante nuevo con la información correcta.</p>
      
      ${timeRemaining ? `<div class="info-box"><p>Tu pieza sigue reservada. ${timeRemaining}</p></div>` : ''}
      
      <a href="${params.paymentUrl}" class="button">Subir Nuevo Comprobante</a>
      
      <p style="font-size: 14px; color: #666; margin-top: 24px;">
        Si tienes dudas sobre el proceso de pago, no dudes en contactarnos por Instagram o email.
      </p>
    </div>
    
    <div class="footer">
      <p><strong>Bagclue</strong><br>
      Piezas de lujo auténticas<br>
      hola@bagclue.com</p>
      <p style="margin-top: 12px;">
        <a href="https://bagclue.com" style="color: #E85A9A; text-decoration: none;">bagclue.com</a> •
        <a href="https://ig.me/m/salebybagcluemx" style="color: #E85A9A; text-decoration: none;">Instagram</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

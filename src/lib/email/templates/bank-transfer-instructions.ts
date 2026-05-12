/**
 * Template: Instrucciones de Transferencia Bancaria
 * Trigger: order bank_transfer_mxn created, transaction.status = pending
 */

interface BankTransferInstructionsParams {
  customerName: string;
  orderId: string;
  productName: string;
  productBrand: string;
  amount: number;
  currency: string;
  paymentReference: string;
  expiresAt: string;
  bankName: string;
  accountHolder: string;
  clabe: string;
  paymentUrl: string;
}

export function generateBankTransferInstructionsHTML(params: BankTransferInstructionsParams): string {
  const formattedAmount = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: params.currency,
    minimumFractionDigits: 0,
  }).format(params.amount);

  // Format expiry date
  const expiryDate = new Date(params.expiresAt);
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const formattedExpiry = `${expiryDate.getDate()} ${months[expiryDate.getMonth()]} ${expiryDate.getFullYear()}, ${expiryDate.getHours()}:${expiryDate.getMinutes().toString().padStart(2, '0')}`;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Instrucciones de Pago</title>
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
      margin-bottom: 24px;
    }
    h1 {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 24px;
      font-weight: 600;
      color: #0B0B0B;
      margin: 0 0 20px 0;
    }
    h2 {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 20px;
      font-weight: 600;
      color: #0B0B0B;
      margin: 24px 0 16px 0;
    }
    p {
      font-size: 16px;
      line-height: 1.6;
      color: #333;
      margin: 0 0 16px 0;
    }
    .highlight-box {
      background: #FFF4F8;
      border-left: 4px solid #E85A9A;
      padding: 16px 20px;
      margin: 20px 0;
      border-radius: 8px;
    }
    .highlight-box p {
      margin: 0;
      color: #0B0B0B;
      font-weight: 500;
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
      text-align: right;
    }
    .bank-instructions {
      background: #FFFBF8;
      border: 2px solid #E85A9A;
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
    }
    .bank-row {
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #E5E5E5;
    }
    .bank-row:last-child {
      margin-bottom: 0;
      padding-bottom: 0;
      border-bottom: none;
    }
    .bank-label {
      font-size: 13px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .bank-value {
      font-size: 18px;
      font-weight: 600;
      color: #0B0B0B;
      font-family: 'Courier New', monospace;
    }
    .reference-highlight {
      background: #E85A9A;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      text-align: center;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 2px;
      font-family: 'Courier New', monospace;
      margin: 16px 0;
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
    .warning {
      background: #FFF4E6;
      border-left: 4px solid #F59E0B;
      padding: 16px 20px;
      margin: 20px 0;
      border-radius: 8px;
    }
    .warning p {
      margin: 0;
      color: #78350F;
      font-size: 14px;
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
      h2 {
        font-size: 18px;
      }
      .button {
        display: block;
        width: 100%;
      }
      .bank-value {
        font-size: 16px;
      }
      .reference-highlight {
        font-size: 18px;
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
      <h1>Tu pieza Bagclue está reservada</h1>
      
      <p>Hola ${params.customerName},</p>
      
      <div class="highlight-box">
        <p>Tu pieza queda reservada mientras validamos tu pago.</p>
      </div>
      
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
          <span class="detail-label">Monto a transferir</span>
          <span class="detail-value">${formattedAmount}</span>
        </div>
      </div>
      
      <h2>📋 Instrucciones de Pago</h2>
      
      <p>Realiza la transferencia bancaria con los siguientes datos:</p>
      
      <div class="bank-instructions">
        <div class="bank-row">
          <div class="bank-label">Banco</div>
          <div class="bank-value">${params.bankName}</div>
        </div>
        <div class="bank-row">
          <div class="bank-label">Titular</div>
          <div class="bank-value">${params.accountHolder}</div>
        </div>
        <div class="bank-row">
          <div class="bank-label">CLABE</div>
          <div class="bank-value">${params.clabe}</div>
        </div>
        <div class="bank-row">
          <div class="bank-label">Monto Exacto</div>
          <div class="bank-value">${formattedAmount}</div>
        </div>
      </div>
      
      <p style="margin-top: 24px; font-weight: 600;">📌 Referencia de pago (importante):</p>
      <div class="reference-highlight">${params.paymentReference}</div>
      <p style="font-size: 14px; color: #666;">Incluye esta referencia en tu transferencia para identificar tu pago.</p>
      
      <div class="warning">
        <p>⏰ Tienes hasta el <strong>${formattedExpiry}</strong> para completar tu transferencia (24 horas).</p>
      </div>
      
      <p style="margin-top: 32px;"><strong>Siguiente paso:</strong></p>
      <p>Una vez realizada la transferencia, sube tu comprobante de pago para que nuestro equipo valide el pago en banco.</p>
      
      <a href="${params.paymentUrl}" class="button">Subir Comprobante de Pago</a>
      
      <p style="font-size: 14px; color: #666; margin-top: 24px;">
        Validaremos tu pago en las próximas horas y te notificaremos por email.
      </p>
    </div>
    
    <div class="footer">
      <p><strong>Bagclue</strong><br>
      Piezas de lujo auténticas<br>
      hola@bagclue.com</p>
      <p style="margin-top: 12px;">
        <a href="https://bagclue.com" style="color: #E85A9A; text-decoration: none;">bagclue.com</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

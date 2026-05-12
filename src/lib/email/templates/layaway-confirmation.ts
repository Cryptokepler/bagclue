/**
 * Template: Confirmación de Apartado
 * Trigger: depósito de apartado confirmado
 */

interface LayawayConfirmationParams {
  customerName: string;
  productName: string;
  totalPrice: number;
  amountPaid: number;
  remainingBalance: number;
  currency: string;
  accountUrl: string;
}

export function generateLayawayConfirmationHTML(params: LayawayConfirmationParams): string {
  const formatCurrency = (amount: number) => new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: params.currency,
    minimumFractionDigits: 0,
  }).format(amount);

  const progressPercent = Math.round((params.amountPaid / params.totalPrice) * 100);

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Apartado Confirmado</title>
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
    .progress-bar {
      width: 100%;
      height: 8px;
      background: #E5E5E5;
      border-radius: 4px;
      overflow: hidden;
      margin: 16px 0;
    }
    .progress-fill {
      height: 100%;
      background: #E85A9A;
      width: ${progressPercent}%;
      transition: width 0.3s ease;
    }
    .progress-text {
      font-size: 14px;
      color: #666;
      text-align: center;
      margin-top: 8px;
    }
    .remaining {
      font-size: 20px;
      font-weight: 600;
      color: #E85A9A;
      text-align: center;
      margin: 20px 0;
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
    .status {
      background: #10B981;
      color: white;
      padding: 8px 16px;
      border-radius: 6px;
      display: inline-block;
      font-size: 14px;
      font-weight: 600;
      margin: 16px 0;
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
      <h1>✅ Apartado Confirmado</h1>
      
      <p>Hola ${params.customerName},</p>
      
      <p>Tu pago ha sido recibido exitosamente. Gracias por apartar tu pieza con Bagclue.</p>
      
      <div class="status">✓ Pago Recibido</div>
      
      <div class="detail">
        <div class="detail-row">
          <span class="detail-label">Producto</span>
          <span class="detail-value">${params.productName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Precio Total</span>
          <span class="detail-value">${formatCurrency(params.totalPrice)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Pagado Hoy</span>
          <span class="detail-value">${formatCurrency(params.amountPaid)}</span>
        </div>
      </div>
      
      <div class="progress-bar">
        <div class="progress-fill"></div>
      </div>
      <div class="progress-text">${progressPercent}% completado</div>
      
      <div class="remaining">
        Saldo pendiente: ${formatCurrency(params.remainingBalance)}
      </div>
      
      <p>Puedes continuar con pagos semanales hasta completar el total. Una vez pagado, tu pieza será enviada.</p>
      
      <a href="${params.accountUrl}" class="button">Ver Mi Apartado</a>
      
      <p style="font-size: 14px; color: #666; margin-top: 24px;">
        Si tienes dudas sobre tu apartado, contáctanos por Instagram o WhatsApp.
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

/**
 * Template: Welcome Email
 * Trigger: Post-callback cuando customer_profiles.created_at < 5 min
 * Purpose: Dar bienvenida a nuevos clientes Bagclue
 */

interface WelcomeEmailParams {
  customerName?: string;
  email: string;
}

export function generateWelcomeHTML(params: WelcomeEmailParams): string {
  const displayName = params.customerName || 'Cliente';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenida a Bagclue</title>
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
      font-size: 32px;
      letter-spacing: 0.3em;
      color: #0B0B0B;
      margin-bottom: 10px;
      font-weight: 400;
    }
    .card {
      background: white;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    h1 {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 28px;
      font-weight: 600;
      color: #0B0B0B;
      margin: 0 0 20px 0;
      line-height: 1.3;
    }
    p {
      font-size: 16px;
      line-height: 1.7;
      color: #333;
      margin: 0 0 16px 0;
    }
    .greeting {
      font-size: 18px;
      color: #0B0B0B;
      margin-bottom: 24px;
    }
    .value-props {
      background: #FFFBF8;
      border-radius: 8px;
      padding: 24px;
      margin: 32px 0;
    }
    .value-prop {
      display: flex;
      align-items: flex-start;
      margin-bottom: 16px;
      font-size: 15px;
      line-height: 1.6;
    }
    .value-prop:last-child {
      margin-bottom: 0;
    }
    .value-prop-icon {
      flex-shrink: 0;
      width: 24px;
      margin-right: 12px;
      font-size: 18px;
    }
    .cta-primary {
      display: block;
      background: #E85A9A;
      color: white;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 50px;
      text-align: center;
      font-weight: 600;
      font-size: 16px;
      letter-spacing: 0.02em;
      margin: 32px 0 16px 0;
      box-shadow: 0 4px 12px rgba(232, 90, 154, 0.25);
    }
    .cta-secondary {
      display: block;
      text-align: center;
      color: #E85A9A;
      text-decoration: none;
      font-size: 15px;
      margin: 16px 0;
      font-weight: 500;
    }
    .cta-secondary:hover {
      text-decoration: underline;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 30px;
      border-top: 1px solid #E5E5E5;
      font-size: 14px;
      color: #666;
    }
    .footer-links {
      margin: 16px 0;
    }
    .footer-link {
      color: #666;
      text-decoration: none;
      margin: 0 12px;
      font-size: 13px;
    }
    .footer-link:hover {
      color: #E85A9A;
      text-decoration: underline;
    }
    .signature {
      font-style: italic;
      color: #666;
      margin-top: 24px;
      font-size: 15px;
    }
    @media only screen and (max-width: 600px) {
      .card {
        padding: 24px;
      }
      h1 {
        font-size: 24px;
      }
      .cta-primary {
        padding: 14px 28px;
        font-size: 15px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="logo">BAGCLUE</div>
    </div>

    <!-- Card -->
    <div class="card">
      <!-- Greeting -->
      <p class="greeting">¡Hola ${displayName}! 👋</p>

      <!-- Main Message -->
      <h1>Bienvenida a Bagclue — tu nueva boutique de piezas de lujo verificadas</h1>

      <p>
        En Bagclue, cada pieza cuenta una historia. Seleccionamos bolsas, zapatos y joyería 
        de las mejores casas de lujo, verificadas por Entrupy, para que compres con total confianza.
      </p>

      <!-- Value Props -->
      <div class="value-props">
        <div class="value-prop">
          <span class="value-prop-icon">✓</span>
          <span><strong>Autenticidad certificada</strong> — Cada pieza verificada por Entrupy</span>
        </div>
        <div class="value-prop">
          <span class="value-prop-icon">✨</span>
          <span><strong>Curaduría selecta</strong> — Solo las mejores marcas de lujo</span>
        </div>
        <div class="value-prop">
          <span class="value-prop-icon">📦</span>
          <span><strong>Envíos seguros</strong> — Entrega asegurada con tracking a todo México</span>
        </div>
        <div class="value-prop">
          <span class="value-prop-icon">💎</span>
          <span><strong>Apartado disponible</strong> — Pagos semanales sin intereses</span>
        </div>
      </div>

      <p style="margin-top: 24px;">
        ¿Lista para encontrar tu próxima pieza?
      </p>

      <!-- CTA Primary -->
      <a href="https://bagclue.vercel.app/catalogo" class="cta-primary">
        Explorar colección →
      </a>

      <!-- CTA Secondary -->
      <a href="https://ig.me/m/salebybagcluemx" class="cta-secondary" target="_blank" rel="noopener noreferrer">
        ¿Tienes dudas? Hablar con Bagclue por Instagram
      </a>

      <!-- Signature -->
      <p class="signature">
        Con cariño,<br>
        El equipo Bagclue
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-links">
        <a href="https://bagclue.vercel.app/catalogo" class="footer-link">Catálogo</a>
        <a href="https://bagclue.vercel.app/apartado" class="footer-link">Apartado</a>
        <a href="https://bagclue.vercel.app/nosotros" class="footer-link">Nosotros</a>
        <a href="https://bagclue.vercel.app/contacto" class="footer-link">Contacto</a>
      </div>
      <p style="color: #999; font-size: 12px; margin-top: 16px;">
        © ${new Date().getFullYear()} Bagclue. Todos los derechos reservados.<br>
        Piezas de lujo verificadas en México
      </p>
    </div>
  </div>
</body>
</html>
`;
}

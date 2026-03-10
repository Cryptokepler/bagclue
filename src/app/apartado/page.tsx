import InstagramCTA from '@/components/InstagramCTA';

export default function ApartadoPage() {
  return (
    <div className="pt-28 pb-24">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-20">
          <span className="text-xs tracking-[0.5em] uppercase text-[#E91E8C]/60">Plan de pagos</span>
          <h1 className="font-[family-name:var(--font-playfair)] text-4xl md:text-5xl text-[#F5F0EB] mt-3">Apartado</h1>
          <p className="text-lg text-[#F5F0EB]/50 mt-6 max-w-2xl mx-auto leading-relaxed">
            Llévate tu pieza de lujo sin pagar todo de una vez. Nuestro sistema de apartado te permite asegurar tu pieza con pagos semanales.
          </p>
          <div className="w-16 h-px bg-[#E91E8C]/30 mx-auto mt-8" />
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          {[
            { step: '01', title: 'Elige tu pieza', desc: 'Explora nuestro catálogo y selecciona la pieza que deseas. Escríbenos por Instagram para confirmar disponibilidad.' },
            { step: '02', title: 'Paga el enganche', desc: 'Realiza el pago inicial para asegurar tu pieza. El monto del enganche varía según el precio del artículo.' },
            { step: '03', title: 'Abonos semanales', desc: 'Realiza abonos semanales cómodos hasta completar el pago total. Tu pieza queda apartada exclusivamente para ti.' },
            { step: '04', title: 'Recibe tu pieza', desc: 'Una vez completado el pago, te enviamos tu pieza de lujo con certificado de autenticidad Entrupy.' },
          ].map(s => (
            <div key={s.step} className="border border-[#E91E8C]/10 p-8 hover:border-[#E91E8C]/30 transition-all duration-500">
              <span className="font-[family-name:var(--font-playfair)] text-4xl text-[#E91E8C]/20">{s.step}</span>
              <h3 className="font-[family-name:var(--font-playfair)] text-xl text-[#F5F0EB] mt-4 mb-3">{s.title}</h3>
              <p className="text-sm text-[#F5F0EB]/50 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Benefits */}
        <div className="bg-[#111] border border-[#E91E8C]/10 p-10 mb-20">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl text-[#F5F0EB] mb-8 text-center">Beneficios</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: '💎', title: 'Sin intereses', desc: 'Pagas el precio exacto, sin cargos adicionales.' },
              { icon: '🔒', title: 'Pieza asegurada', desc: 'Tu pieza queda apartada exclusivamente para ti.' },
              { icon: '✓', title: 'Autenticidad', desc: 'Todas las piezas verificadas por Entrupy.' },
            ].map(b => (
              <div key={b.title} className="text-center">
                <span className="text-3xl">{b.icon}</span>
                <h3 className="font-[family-name:var(--font-playfair)] text-lg text-[#F5F0EB] mt-4 mb-2">{b.title}</h3>
                <p className="text-sm text-[#F5F0EB]/50">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-[#F5F0EB]/50 mb-6">¿Te interesa apartar una pieza? Escríbenos para conocer los detalles.</p>
          <InstagramCTA text="Consultar apartado" />
        </div>
      </div>
    </div>
  );
}

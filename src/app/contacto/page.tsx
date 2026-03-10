import InstagramCTA from '@/components/InstagramCTA';

const faqs = [
  { q: '¿Cómo puedo comprar una pieza?', a: 'Escríbenos por Instagram DM con el código de la pieza que te interesa. Te daremos todos los detalles sobre disponibilidad, precio y envío.' },
  { q: '¿Las piezas son auténticas?', a: 'Sí, todas nuestras piezas están verificadas por Entrupy, la tecnología líder en autenticación de artículos de lujo. Cada compra incluye certificado de autenticidad.' },
  { q: '¿Hacen envíos a todo México?', a: 'Sí, realizamos envíos seguros a toda la República Mexicana. Los detalles de envío se acuerdan directamente por Instagram DM.' },
  { q: '¿Qué es el sistema de apartado?', a: 'Es nuestro plan de pagos donde puedes asegurar tu pieza con un enganche y completar el pago con abonos semanales, sin intereses.' },
  { q: '¿Qué es París 2U?', a: 'Es nuestro servicio de sourcing en París. Si buscas una pieza específica, podemos conseguirla directamente en boutiques europeas.' },
  { q: '¿Aceptan devoluciones?', a: 'Las políticas de devolución se manejan caso por caso. Contáctanos por Instagram para más información.' },
];

export default function ContactoPage() {
  return (
    <div className="pt-28 pb-24">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-20">
          <span className="text-xs tracking-[0.5em] uppercase text-[#C9A96E]/60">Hablemos</span>
          <h1 className="font-[family-name:var(--font-playfair)] text-4xl md:text-5xl text-[#F5F0EB] mt-3">Contacto</h1>
          <p className="text-[#F5F0EB]/50 mt-6">La mejor forma de contactarnos es por Instagram DM</p>
          <div className="w-16 h-px bg-[#C9A96E]/30 mx-auto mt-8" />
        </div>

        {/* Contact card */}
        <div className="bg-[#111] border border-[#C9A96E]/10 p-10 mb-16 text-center">
          <div className="mb-8">
            <InstagramCTA text="Escríbenos por Instagram" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10 text-sm">
            <div>
              <h3 className="text-xs tracking-widest uppercase text-[#C9A96E] mb-2">Instagram</h3>
              <a href="https://instagram.com/salebybagcluemx" target="_blank" rel="noopener noreferrer" className="text-[#F5F0EB]/50 hover:text-[#C9A96E] transition-colors">@salebybagcluemx</a>
            </div>
            <div>
              <h3 className="text-xs tracking-widest uppercase text-[#C9A96E] mb-2">Ubicación</h3>
              <p className="text-[#F5F0EB]/50">El Campanario, Querétaro, México</p>
            </div>
            <div>
              <h3 className="text-xs tracking-widest uppercase text-[#C9A96E] mb-2">Horario</h3>
              <p className="text-[#F5F0EB]/50">Lunes a Sábado<br />10:00 – 19:00 hrs</p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl text-[#F5F0EB] mb-8 text-center">Preguntas Frecuentes</h2>
          <div className="space-y-4">
            {faqs.map((f, i) => (
              <details key={i} className="group border border-[#C9A96E]/10 hover:border-[#C9A96E]/20 transition-colors">
                <summary className="cursor-pointer p-6 text-[#F5F0EB] text-sm flex justify-between items-center">
                  {f.q}
                  <span className="text-[#C9A96E] group-open:rotate-45 transition-transform duration-300 text-lg">+</span>
                </summary>
                <div className="px-6 pb-6 text-sm text-[#F5F0EB]/50 leading-relaxed">{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

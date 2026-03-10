import InstagramCTA from '@/components/InstagramCTA';

export default function NosotrosPage() {
  return (
    <div className="pt-28 pb-24">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-20">
          <span className="text-xs tracking-[0.5em] uppercase text-[#C9A96E]/60">Nuestra historia</span>
          <h1 className="font-[family-name:var(--font-playfair)] text-4xl md:text-5xl text-[#F5F0EB] mt-3">Nosotros</h1>
          <div className="w-16 h-px bg-[#C9A96E]/30 mx-auto mt-8" />
        </div>

        {/* Story */}
        <div className="space-y-8 text-[#F5F0EB]/60 leading-relaxed mb-20">
          <p className="text-lg">
            <span className="text-[#C9A96E] font-[family-name:var(--font-playfair)]">BAGCLUE</span> nació en 2019 con una visión clara: hacer accesible el lujo auténtico desde México. Lo que comenzó como una pasión por las piezas de diseñador se convirtió en un referente de confianza en el mercado de lujo preloved.
          </p>
          <p>
            Desde El Campanario, Querétaro, conectamos a nuestros clientes con las casas de moda más prestigiosas del mundo: Chanel, Hermès, Goyard, Céline, Louis Vuitton y Balenciaga. Cada pieza que ofrecemos es cuidadosamente seleccionada y verificada.
          </p>
          <p>
            Nuestro servicio <span className="text-[#C9A96E]">París 2U</span> nos permite traer piezas directamente desde boutiques en Francia, garantizando acceso a colecciones exclusivas que no siempre están disponibles en México.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {[
            { number: '2019', label: 'Desde' },
            { number: '98.4K', label: 'Seguidores' },
            { number: '1,587+', label: 'Piezas vendidas' },
            { number: '100%', label: 'Autenticidad' },
          ].map(s => (
            <div key={s.label} className="text-center border border-[#C9A96E]/10 p-6">
              <span className="font-[family-name:var(--font-playfair)] text-3xl text-[#C9A96E]">{s.number}</span>
              <p className="text-xs text-[#F5F0EB]/40 mt-2 tracking-wider uppercase">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Entrupy */}
        <div className="bg-[#111] border border-emerald-500/20 p-10 mb-20">
          <div className="flex items-start gap-4">
            <div className="w-3 h-3 bg-emerald-400 rounded-full mt-1 shrink-0" />
            <div>
              <h2 className="font-[family-name:var(--font-playfair)] text-2xl text-[#F5F0EB] mb-4">Verificado por Entrupy</h2>
              <p className="text-[#F5F0EB]/50 leading-relaxed mb-4">
                Entrupy es la tecnología líder mundial en autenticación de artículos de lujo. Utiliza inteligencia artificial y microscopía avanzada para verificar la autenticidad de cada pieza.
              </p>
              <p className="text-[#F5F0EB]/50 leading-relaxed">
                Todas nuestras piezas pasan por este proceso de verificación, lo que te garantiza que estás adquiriendo un artículo 100% auténtico. Cada compra incluye su certificado de autenticidad.
              </p>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="text-center mb-20">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl text-[#F5F0EB] mb-4">📍 Ubicación</h2>
          <p className="text-[#F5F0EB]/50">El Campanario, Querétaro, México</p>
          <p className="text-xs text-[#F5F0EB]/30 mt-2">Envíos a toda la República Mexicana</p>
        </div>

        <div className="text-center">
          <InstagramCTA text="Conócenos en Instagram" />
        </div>
      </div>
    </div>
  );
}

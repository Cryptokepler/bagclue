import Link from 'next/link'

export default function TrustAuthenticity() {
  return (
    <section className="bg-[#FFFBF8] py-16 md:py-24 px-6">
      <div className="max-w-4xl mx-auto text-center">
        {/* Headline */}
        <h2 className="text-[#3A3431] font-[family-name:var(--font-cormorant)] font-medium text-3xl md:text-4xl mb-8">
          Autenticidad y confianza
        </h2>
        
        {/* Body */}
        <div className="text-[#2D2420] font-[family-name:var(--font-manrope)] text-base md:text-lg leading-[1.8] space-y-4 mb-10">
          <p>
            En Bagclue, cada pieza es curada personalmente, verificada por Entrupy 
            y seleccionada con el mismo criterio que usarías tú. No somos un marketplace, 
            somos tu concierge de lujo entre París y México.
          </p>
          <p>
            Compra con total seguridad, aparta con flexibilidad, y recibe atención 
            personalizada en cada paso. Porque las piezas de lujo merecen una 
            experiencia a su altura.
          </p>
        </div>
        
        {/* CTA */}
        <Link
          href="/nosotros"
          className="inline-block text-[#8B4852] font-[family-name:var(--font-manrope)] text-[15px] font-medium hover:text-[#E85A9A] hover:underline transition-all duration-300"
        >
          Conoce más sobre nosotros →
        </Link>
      </div>
    </section>
  )
}

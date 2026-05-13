import Link from 'next/link'

export default function JoinBagclue() {
  return (
    <section className="bg-[#FFFBF8] py-16 md:py-20 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="border border-[#E85A9A]/20 rounded-lg p-8 md:p-10 text-center">
          {/* Mini label */}
          <p className="text-[#E85A9A] text-[11px] font-[family-name:var(--font-manrope)] font-medium tracking-[0.12em] uppercase mb-4">
            Bagclue Members
          </p>
          
          {/* Título */}
          <h2 className="text-[#3A3431] font-[family-name:var(--font-cormorant)] font-medium text-3xl md:text-4xl leading-[1.3] mb-6">
            Únete a Bagclue
          </h2>
          
          {/* Copy */}
          <p className="text-[#2D2420] font-[family-name:var(--font-manrope)] text-base md:text-lg leading-[1.7] mb-8 opacity-90">
            Crea tu cuenta para guardar tus direcciones, seguir tus pedidos, apartar piezas y recibir acceso a nuevas llegadas.
          </p>
          
          {/* CTA */}
          <Link
            href="/account/login"
            className="inline-block bg-[#E85A9A] text-white px-10 py-4 rounded-full font-[family-name:var(--font-manrope)] font-semibold text-[15px] tracking-[0.02em] hover:bg-[#EC5C9F] hover:-translate-y-0.5 transition-all duration-400 ease-out shadow-sm"
          >
            Crear cuenta
          </Link>
        </div>
      </div>
    </section>
  )
}

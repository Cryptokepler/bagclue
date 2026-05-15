import Link from 'next/link'

export default function YourAccountBagclue() {
  return (
    <section className="py-20 md:py-28 bg-[#FFFBF7]">
      <div className="max-w-5xl mx-auto px-6">
        {/* Container con borde fino */}
        <div className="border border-[#E85A9A]/20 rounded-2xl p-10 md:p-16 bg-white/50 backdrop-blur-sm">
          {/* Título */}
          <h2 className="text-[#3A3431] font-[family-name:var(--font-cormorant)] font-semibold text-3xl md:text-4xl text-center mb-4">
            Tu cuenta Bagclue
          </h2>
          
          {/* Subcopy */}
          <p className="text-[#5B5551] font-[family-name:var(--font-manrope)] text-base md:text-lg leading-[1.7] text-center max-w-2xl mx-auto mb-12 opacity-90">
            Regístrate para guardar tus direcciones, seguir tus pedidos y administrar tus apartados en un solo lugar.
          </p>
          
          {/* Pilares en grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-full bg-[#E85A9A]/10">
                <svg className="w-6 h-6 text-[#E85A9A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-[#2D2420] font-[family-name:var(--font-manrope)] text-sm font-medium">
                Guarda tus<br />direcciones
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-full bg-[#E85A9A]/10">
                <svg className="w-6 h-6 text-[#E85A9A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <p className="text-[#2D2420] font-[family-name:var(--font-manrope)] text-sm font-medium">
                Sigue tus<br />pedidos
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-full bg-[#E85A9A]/10">
                <svg className="w-6 h-6 text-[#E85A9A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-[#2D2420] font-[family-name:var(--font-manrope)] text-sm font-medium">
                Administra tus<br />apartados
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-full bg-[#E85A9A]/10">
                <svg className="w-6 h-6 text-[#E85A9A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-[#2D2420] font-[family-name:var(--font-manrope)] text-sm font-medium">
                Compra más<br />rápido
              </p>
            </div>
          </div>
          
          {/* CTA */}
          <div className="text-center">
            <Link
              href="/account/login"
              className="inline-flex items-center justify-center bg-[#E85A9A] text-white px-12 py-4 rounded-full font-[family-name:var(--font-manrope)] font-semibold text-[15px] tracking-[0.02em] hover:bg-[#EC5C9F] hover:-translate-y-0.5 transition-all duration-400 ease-out shadow-sm"
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

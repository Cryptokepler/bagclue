import Link from 'next/link'

export default function FromParis() {
  return (
    <section className="bg-[#F5F1ED] py-20 md:py-32 px-6 md:px-10">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20 items-center">
          {/* Imagen placeholder */}
          <div className="order-2 md:order-1">
            <div 
              className="relative aspect-[4/5] rounded overflow-hidden bg-[#C9BFB7] flex items-center justify-center"
            >
              <p className="text-[#3A3431]/30 font-[family-name:var(--font-cormorant)] text-2xl italic">
                Paris
              </p>
            </div>
          </div>
          
          {/* Texto */}
          <div className="order-1 md:order-2">
            {/* Mini label */}
            <p className="text-[#9B8F87] font-[family-name:var(--font-manrope)] text-[11px] font-medium tracking-[0.12em] uppercase mb-6">
              From Paris
            </p>
            
            {/* Headline */}
            <h2 className="text-[#3A3431] font-[family-name:var(--font-cormorant)] font-medium text-3xl md:text-4xl leading-[1.3] mb-8">
              Rare finds, runway energy and curated pieces 
              sourced from Europe for clients in Mexico
            </h2>
            
            {/* Link */}
            <Link
              href="/nosotros"
              className="inline-block text-[#8B4852] font-[family-name:var(--font-manrope)] text-[15px] font-medium hover:text-[#E85A9A] hover:underline transition-all duration-300"
            >
              Cómo funciona →
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

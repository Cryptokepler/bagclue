import Link from 'next/link'

export default function HeroEditorial() {
  return (
    <section 
      className="relative h-[90vh] md:h-[90vh] flex items-center justify-center overflow-hidden"
      style={{
        backgroundImage: 'linear-gradient(135deg, #2D2420 0%, #3A3431 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay sutil */}
      <div className="absolute inset-0 bg-[#3A3431]/10" />
      
      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* Mini label */}
        <p 
          className="text-[#FFFBF8] text-[11px] font-[family-name:var(--font-manrope)] font-medium tracking-[0.12em] uppercase mb-6"
        >
          Sourcing International
        </p>
        
        {/* Headline */}
        <h1 
          className="text-[#FFFBF8] font-[family-name:var(--font-cormorant)] font-semibold text-4xl md:text-[56px] leading-[1.1] tracking-[-0.02em] mb-8"
        >
          Luxury sourcing between <br className="hidden md:block" />
          Paris & Mexico
        </h1>
        
        {/* Subheadline */}
        <p 
          className="text-[#FFFBF8]/85 font-[family-name:var(--font-manrope)] text-base md:text-lg leading-[1.7] max-w-2xl mx-auto mb-12"
        >
          Curated luxury pieces sourced internationally for women 
          who want access, rarity and elegance.
        </p>
        
        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/catalogo"
            className="bg-[#FFFBF8] text-[#3A3431] px-10 py-4 rounded-full font-[family-name:var(--font-manrope)] font-semibold text-[15px] tracking-[0.02em] hover:bg-[#E85A9A] hover:text-[#FFFBF8] hover:-translate-y-0.5 transition-all duration-400 ease-out"
          >
            Explorar piezas
          </Link>
          
          <a
            href="https://ig.me/m/salebybagcluemx"
            target="_blank"
            rel="noopener noreferrer"
            className="border-[1.5px] border-[#FFFBF8] text-[#FFFBF8] bg-transparent px-10 py-4 rounded-full font-[family-name:var(--font-manrope)] font-medium text-[15px] hover:bg-[#FFFBF8]/10 hover:border-[#E85A9A] transition-all duration-400 ease-out"
          >
            Solicitar sourcing privado
          </a>
        </div>
        
        {/* Scroll indicator */}
        <div className="mt-16 animate-bounce">
          <span className="text-[#FFFBF8]/60 text-2xl">↓</span>
        </div>
      </div>
    </section>
  )
}

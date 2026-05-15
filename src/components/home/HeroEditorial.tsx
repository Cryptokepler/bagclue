import Link from 'next/link'

export default function HeroEditorial() {
  return (
    <section 
      className="relative h-[90vh] md:h-[90vh] flex items-center justify-center overflow-hidden bg-[#F7EFEA]"
    >
      {/* Decorative subtle gradient overlay */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: 'radial-gradient(circle at 30% 40%, rgba(232, 90, 154, 0.08) 0%, transparent 50%)',
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* Mini label */}
        <p 
          className="text-[#E85A9A] text-[11px] font-[family-name:var(--font-manrope)] font-medium tracking-[0.12em] uppercase mb-6"
        >
          Sourcing International
        </p>
        
        {/* Headline */}
        <h1 
          className="text-[#3A3431] font-[family-name:var(--font-cormorant)] font-semibold text-4xl md:text-[56px] leading-[1.1] tracking-[-0.02em] mb-8"
        >
          Luxury sourcing entre <br className="hidden md:block" />
          París y México
        </h1>
        
        {/* Subheadline */}
        <p 
          className="text-[#2D2420] font-[family-name:var(--font-manrope)] text-base md:text-lg leading-[1.7] max-w-2xl mx-auto mb-6 opacity-90"
        >
          Piezas de lujo curadas internacionalmente para mujeres 
          que buscan acceso, rareza y elegancia.
        </p>

        {/* Account CTA copy */}
        <p 
          className="text-[#5B5551] font-[family-name:var(--font-manrope)] text-sm md:text-base leading-[1.6] max-w-xl mx-auto mb-10 opacity-80"
        >
          Crea tu cuenta para comprar, apartar y dar seguimiento a tus piezas.
        </p>
        
        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/catalogo"
            className="bg-[#E85A9A] text-white px-10 py-4 rounded-full font-[family-name:var(--font-manrope)] font-semibold text-[15px] tracking-[0.02em] hover:bg-[#EC5C9F] hover:-translate-y-0.5 transition-all duration-400 ease-out shadow-sm"
          >
            Explorar piezas
          </Link>
          
          <Link
            href="/account/login"
            className="border-[1.5px] border-[#E85A9A] text-[#E85A9A] bg-transparent px-10 py-4 rounded-full font-[family-name:var(--font-manrope)] font-medium text-[15px] hover:bg-[#E85A9A] hover:text-white transition-all duration-400 ease-out"
          >
            Crear cuenta
          </Link>
        </div>
        
        {/* Sourcing privado como link terciario */}
        <div className="mt-6">
          <a
            href="https://ig.me/m/salebybagcluemx"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#E85A9A] font-[family-name:var(--font-manrope)] text-sm hover:underline underline-offset-4"
          >
            Solicitar sourcing privado →
          </a>
        </div>
        
        {/* Scroll indicator */}
        <div className="mt-16 animate-bounce">
          <span className="text-[#9B8F87] text-2xl">↓</span>
        </div>
      </div>
    </section>
  )
}

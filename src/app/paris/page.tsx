import ProductCard from '@/components/ProductCard';
import InstagramCTA from '@/components/InstagramCTA';
import { products } from '@/data/products';

const parisProducts = products.filter(p => p.origin === 'Francia');

export default function ParisPage() {
  return (
    <div className="pt-28 pb-24">
      <div className="max-w-6xl mx-auto px-6">
        {/* Hero */}
        <div className="text-center mb-20">
          <span className="text-xs tracking-[0.5em] uppercase text-[#C9A96E]/60">Servicio exclusivo</span>
          <h1 className="font-[family-name:var(--font-playfair)] text-4xl md:text-6xl text-[#F5F0EB] mt-3">París 2U</h1>
          <p className="text-lg text-[#F5F0EB]/50 mt-6 max-w-2xl mx-auto leading-relaxed">
            Compramos las piezas que deseas directamente en París y las traemos a México para ti. Acceso exclusivo a boutiques europeas.
          </p>
          <p className="text-2xl mt-4">🇫🇷</p>
          <div className="w-16 h-px bg-[#C9A96E]/30 mx-auto mt-6" />
        </div>

        {/* How it works */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {[
            { step: '01', title: 'Solicita', desc: 'Cuéntanos qué pieza buscas. Podemos conseguir artículos de Goyard, Chanel, Hermès, LV, Céline y más.' },
            { step: '02', title: 'Sourcing', desc: 'Nuestro equipo en París busca y adquiere tu pieza directamente en boutiques oficiales.' },
            { step: '03', title: 'Recibe', desc: 'Te enviamos tu pieza a México con toda la documentación de autenticidad y origen.' },
          ].map(s => (
            <div key={s.step} className="border border-[#C9A96E]/10 p-8 text-center hover:border-[#C9A96E]/30 transition-all duration-500">
              <span className="font-[family-name:var(--font-playfair)] text-4xl text-[#C9A96E]/20">{s.step}</span>
              <h3 className="font-[family-name:var(--font-playfair)] text-xl text-[#F5F0EB] mt-4 mb-3">{s.title}</h3>
              <p className="text-sm text-[#F5F0EB]/50 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Pre-venta items */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <span className="text-xs tracking-[0.5em] uppercase text-[#C9A96E]/60">Desde París</span>
            <h2 className="font-[family-name:var(--font-playfair)] text-3xl text-[#F5F0EB] mt-3">Piezas en Pre-venta</h2>
            <p className="text-sm text-[#F5F0EB]/40 mt-3">Artículos que estamos trayendo desde Francia</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {parisProducts.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-[#111] border border-[#C9A96E]/10 p-12">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl text-[#F5F0EB] mb-4">¿Buscas algo especial?</h2>
          <p className="text-[#F5F0EB]/50 mb-8 max-w-lg mx-auto">Si no encuentras la pieza que buscas, escríbenos. Podemos conseguirla directamente en París.</p>
          <InstagramCTA text="Solicitar pieza" />
        </div>
      </div>
    </div>
  );
}

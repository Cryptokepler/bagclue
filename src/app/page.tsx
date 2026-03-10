import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import InstagramCTA from '@/components/InstagramCTA';
import { products } from '@/data/products';

const featured = products.filter(p => p.status === 'En inventario').slice(0, 6);

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A] via-[#111] to-[#0A0A0A]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(201,169,110,0.05)_0%,_transparent_70%)]" />

        <div className="relative z-10 text-center px-6 animate-fade-in-up">
          <div className="mb-6">
            <span className="text-xs tracking-[0.5em] uppercase text-[#C9A96E]/60">SALEBYBAGCLUE MX</span>
          </div>
          <h1 className="font-[family-name:var(--font-playfair)] text-5xl md:text-7xl lg:text-8xl tracking-[0.2em] text-[#C9A96E] mb-6">
            BAGCLUE
          </h1>
          <p className="text-sm md:text-base tracking-[0.3em] uppercase text-[#F5F0EB]/60 mb-4">
            New & Preloved Luxury Items
          </p>
          <p className="text-xs tracking-[0.4em] text-[#F5F0EB]/40 mb-2">
            MX 🇲🇽 PARIS 🇫🇷 SINCE 2019
          </p>
          <div className="flex items-center justify-center gap-2 mt-6 mb-10">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-xs tracking-wider text-emerald-400/70">Autenticidad garantizada — Verificado por Entrupy</span>
          </div>
          <InstagramCTA />
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-5 h-5 text-[#C9A96E]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
        </div>
      </section>

      {/* Featured */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <span className="text-xs tracking-[0.5em] uppercase text-[#C9A96E]/60">Selección</span>
          <h2 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl text-[#F5F0EB] mt-3">Piezas Disponibles</h2>
          <div className="w-16 h-px bg-[#C9A96E]/30 mx-auto mt-6" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
        <div className="text-center mt-12">
          <Link href="/catalogo" className="text-sm tracking-widest uppercase text-[#C9A96E] border border-[#C9A96E]/30 px-8 py-3 hover:bg-[#C9A96E] hover:text-[#0A0A0A] transition-all duration-300">
            Ver catálogo completo
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-6 py-24 border-t border-[#C9A96E]/10">
        <div className="text-center mb-16">
          <span className="text-xs tracking-[0.5em] uppercase text-[#C9A96E]/60">Categorías</span>
          <h2 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl text-[#F5F0EB] mt-3">Explora</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'Bolsas', desc: 'Chanel, Hermès, Goyard y más', href: '/catalogo', gradient: 'from-[#1a1a1a] to-[#C9A96E]/20' },
            { title: 'Accesorios', desc: 'Lentes, cinturones, gorros', href: '/catalogo', gradient: 'from-[#1a1a1a] to-[#D4A0A0]/20' },
            { title: 'Colección París', desc: 'Piezas directo desde Francia', href: '/paris', gradient: 'from-[#1a1a1a] to-[#4A3520]/40' },
          ].map(c => (
            <Link key={c.title} href={c.href} className="group relative overflow-hidden border border-[#C9A96E]/10 hover:border-[#C9A96E]/30 transition-all duration-500">
              <div className={`bg-gradient-to-br ${c.gradient} p-12 text-center`}>
                <h3 className="font-[family-name:var(--font-playfair)] text-2xl text-[#F5F0EB] mb-2">{c.title}</h3>
                <p className="text-xs text-[#F5F0EB]/40 tracking-wider">{c.desc}</p>
                <span className="inline-block mt-6 text-xs tracking-widest uppercase text-[#C9A96E] group-hover:translate-x-2 transition-transform duration-300">Explorar →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How to buy */}
      <section className="max-w-7xl mx-auto px-6 py-24 border-t border-[#C9A96E]/10">
        <div className="text-center mb-16">
          <span className="text-xs tracking-[0.5em] uppercase text-[#C9A96E]/60">Proceso</span>
          <h2 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl text-[#F5F0EB] mt-3">Cómo Comprar</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            { step: '01', title: 'Elige', desc: 'Explora nuestro catálogo y encuentra la pieza perfecta para ti.' },
            { step: '02', title: 'Contacta', desc: 'Escríbenos por Instagram DM para confirmar disponibilidad y precio.' },
            { step: '03', title: 'Recibe', desc: 'Realizamos envíos seguros a toda la República Mexicana.' },
          ].map(s => (
            <div key={s.step} className="text-center">
              <span className="font-[family-name:var(--font-playfair)] text-5xl text-[#C9A96E]/20">{s.step}</span>
              <h3 className="font-[family-name:var(--font-playfair)] text-xl text-[#F5F0EB] mt-4 mb-3">{s.title}</h3>
              <p className="text-sm text-[#F5F0EB]/50 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About teaser */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center border-t border-[#C9A96E]/10">
        <span className="text-xs tracking-[0.5em] uppercase text-[#C9A96E]/60">Nuestra historia</span>
        <h2 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl text-[#F5F0EB] mt-3 mb-6">Desde 2019</h2>
        <p className="text-[#F5F0EB]/50 leading-relaxed mb-8">
          BAGCLUE nació con una misión clara: hacer accesible el lujo auténtico. Desde Querétaro, México, conectamos a nuestros clientes con piezas verificadas de las casas de moda más prestigiosas del mundo. Cada artículo cuenta con certificación de autenticidad por Entrupy.
        </p>
        <Link href="/nosotros" className="text-sm tracking-widest uppercase text-[#C9A96E] border border-[#C9A96E]/30 px-8 py-3 hover:bg-[#C9A96E] hover:text-[#0A0A0A] transition-all duration-300">
          Conoce más
        </Link>
      </section>

      {/* Instagram */}
      <section className="max-w-7xl mx-auto px-6 py-24 text-center border-t border-[#C9A96E]/10">
        <span className="text-xs tracking-[0.5em] uppercase text-[#C9A96E]/60">Síguenos</span>
        <h2 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl text-[#F5F0EB] mt-3 mb-2">@salebybagcluemx</h2>
        <p className="text-[#F5F0EB]/40 text-sm mb-4">98.4K seguidores · 1,587+ piezas vendidas</p>
        <a href="https://instagram.com/salebybagcluemx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm tracking-widest uppercase text-[#C9A96E] hover:text-[#F5F0EB] transition-colors">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          Seguir en Instagram
        </a>
      </section>
    </>
  );
}

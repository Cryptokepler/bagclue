import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import InstagramCTA from '@/components/InstagramCTA';
import { products } from '@/data/products';

const featured = products.filter(p => p.status === 'En inventario' || p.status === 'Pre-venta').slice(0, 6);

export default function Home() {
  return (
    <>
      {/* Hero — CTA visible arriba */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-pink-100 via-pink-50 to-white" />

        <div className="relative z-10 text-center px-6 animate-fade-in-up max-w-3xl mx-auto">
          <span className="text-xs tracking-[0.5em] uppercase text-pink-400/70 mb-4 block">SALEBYBAGCLUE MX</span>
          <h1 className="font-[family-name:var(--font-playfair)] text-5xl md:text-7xl tracking-[0.15em] text-gray-900 mb-6">
            Descubre el lujo <span className="text-pink-400">auténtico</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-4 max-w-xl mx-auto">
            Desde 2019, conectamos a los amantes de la moda con piezas verificadas de las casas más prestigiosas del mundo.
          </p>
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-sm text-emerald-600 font-medium">Autenticidad garantizada por Entrupy</span>
          </div>
          
          {/* CTA principal visible */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="https://ig.me/m/salebybagcluemx" target="_blank" rel="noopener noreferrer" 
               className="inline-flex items-center gap-3 bg-pink-400 text-white px-8 py-4 text-sm tracking-widest uppercase font-medium hover:bg-pink-500 transition-all duration-300 rounded-full shadow-lg shadow-pink-400/30">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              Contáctanos por Instagram
            </a>
            <Link href="/catalogo" className="text-sm tracking-widest uppercase text-pink-400 border border-pink-300 px-8 py-4 hover:bg-pink-50 transition-all duration-300 rounded-full">
              Ver catálogo
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">✓ Verificado por Entrupy</span>
            <span className="flex items-center gap-1.5">✓ Envíos a todo México</span>
            <span className="flex items-center gap-1.5">✓ +1,500 piezas vendidas</span>
          </div>
        </div>
      </section>

      {/* ¿Por qué elegir BAGCLUE? */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <span className="text-xs tracking-[0.5em] uppercase text-pink-400/60">Nuestra promesa</span>
          <h2 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl text-gray-900 mt-3">¿Por qué elegir BAGCLUE?</h2>
          <div className="w-16 h-px bg-pink-300 mx-auto mt-6" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: '🛡️', title: 'Autenticidad garantizada', desc: 'Cada pieza es verificada por Entrupy, la tecnología líder mundial en autenticación de artículos de lujo.' },
            { icon: '✨', title: 'Selección exclusiva', desc: 'Chanel, Hermès, Goyard, Céline, Louis Vuitton y más. Piezas nuevas y preloved cuidadosamente seleccionadas.' },
            { icon: '🇫🇷', title: 'Directo desde París', desc: 'Con nuestro servicio París 2U, conseguimos la pieza que buscas directamente desde Francia.' },
          ].map(f => (
            <div key={f.title} className="text-center bg-pink-50/50 rounded-2xl p-8 border border-pink-100">
              <span className="text-4xl block mb-4">{f.icon}</span>
              <h3 className="font-[family-name:var(--font-playfair)] text-xl text-gray-900 mb-3">{f.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-pink-100">
        <div className="text-center mb-14">
          <span className="text-xs tracking-[0.5em] uppercase text-pink-400/60">Catálogo</span>
          <h2 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl text-gray-900 mt-3">Piezas Disponibles</h2>
          <div className="w-16 h-px bg-pink-300 mx-auto mt-6" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
        <div className="text-center mt-12">
          <Link href="/catalogo" className="inline-flex items-center gap-2 bg-pink-400 text-white px-8 py-3 text-sm tracking-widest uppercase font-medium hover:bg-pink-500 transition-all duration-300 rounded-full">
            Ver catálogo completo →
          </Link>
        </div>
      </section>

      {/* Testimonios / Social proof */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-pink-100">
        <div className="text-center mb-14">
          <span className="text-xs tracking-[0.5em] uppercase text-pink-400/60">Comunidad</span>
          <h2 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl text-gray-900 mt-3">Lo que dicen nuestras clientas</h2>
          <div className="w-16 h-px bg-pink-300 mx-auto mt-6" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: 'Alejandra A.', text: 'Mi Chanel 25 llegó impecable. La atención fue increíble, super personalizada. 100% recomendado.', rating: '⭐⭐⭐⭐⭐' },
            { name: 'Georgina R.', text: 'Compré una Kelly y el proceso fue transparente desde el inicio. Certificado Entrupy incluido. Volveré sin duda.', rating: '⭐⭐⭐⭐⭐' },
            { name: 'Vero M.', text: 'El servicio París 2U es genial, me consiguieron exactamente la bolsa que quería. Entrega rápida y segura.', rating: '⭐⭐⭐⭐⭐' },
          ].map(t => (
            <div key={t.name} className="bg-white rounded-2xl p-8 border border-pink-100 shadow-sm">
              <p className="text-sm text-gray-600 leading-relaxed mb-4 italic">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-400 font-bold text-sm">{t.name[0]}</div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{t.name}</p>
                  <p className="text-xs">{t.rating}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-gray-400 mt-8">Parte de nuestra comunidad de 98.4K seguidores en Instagram</p>
      </section>

      {/* Cómo Comprar — más visual */}
      <section className="max-w-5xl mx-auto px-6 py-20 border-t border-pink-100">
        <div className="text-center mb-14">
          <span className="text-xs tracking-[0.5em] uppercase text-pink-400/60">Simple y seguro</span>
          <h2 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl text-gray-900 mt-3">Cómo Comprar</h2>
          <div className="w-16 h-px bg-pink-300 mx-auto mt-6" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: '01', icon: '👜', title: 'Explora', desc: 'Navega nuestro catálogo y encuentra tu pieza perfecta. Filtra por marca, modelo o disponibilidad.' },
            { step: '02', icon: '💬', title: 'Contacta', desc: 'Escríbenos por DM en Instagram para confirmar disponibilidad, precio y opciones de apartado.' },
            { step: '03', icon: '📦', title: 'Recibe', desc: 'Envíos seguros a toda la República Mexicana. Tu pieza llega con certificado de autenticidad Entrupy.' },
          ].map(s => (
            <div key={s.step} className="text-center bg-gradient-to-b from-pink-50 to-white rounded-2xl p-8 border border-pink-100">
              <span className="text-4xl block mb-3">{s.icon}</span>
              <span className="text-xs font-bold text-pink-400 tracking-widest">PASO {s.step}</span>
              <h3 className="font-[family-name:var(--font-playfair)] text-xl text-gray-900 mt-2 mb-3">{s.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <p className="text-sm text-gray-500 mb-4">¿Prefieres pagar en parcialidades? Conoce nuestro sistema de apartado.</p>
          <Link href="/apartado" className="text-sm tracking-widest uppercase text-pink-400 border border-pink-300 px-6 py-2.5 hover:bg-pink-50 transition-all duration-300 rounded-full">
            Ver sistema de apartado
          </Link>
        </div>
      </section>

      {/* CTA final + Instagram */}
      <section className="bg-gradient-to-b from-pink-50 to-pink-100 py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl text-gray-900 mb-4">¿Lista para tu próxima pieza?</h2>
          <p className="text-gray-600 mb-8">Únete a nuestra comunidad de 98.4K seguidoras y descubre piezas exclusivas cada semana.</p>
          <a href="https://ig.me/m/salebybagcluemx" target="_blank" rel="noopener noreferrer" 
             className="inline-flex items-center gap-3 bg-pink-400 text-white px-8 py-4 text-sm tracking-widest uppercase font-medium hover:bg-pink-500 transition-all duration-300 rounded-full shadow-lg shadow-pink-400/30">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              Escríbenos por Instagram
            </a>
          <p className="text-xs text-gray-500 mt-6">@salebybagcluemx · Querétaro, México · Desde 2019</p>
        </div>
      </section>
    </>
  );
}
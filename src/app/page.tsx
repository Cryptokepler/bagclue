import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { supabase } from '@/lib/supabase';
import { PRODUCT_PUBLIC_FIELDS } from '@/lib/products-public-fields';
import { dbStatusToLegacy } from '@/types/database';
import type { Brand, ProductStatus, Product as LegacyProduct } from '@/data/products';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

async function getFeaturedProducts() {
  const { data: productsData, error } = await supabase
    .from('products')
    .select(`${PRODUCT_PUBLIC_FIELDS}, product_images(*)`)
    .eq('is_published', true)
    .in('status', ['available', 'preorder'])
    .order('created_at', { ascending: false })
    .limit(6);

  if (error) {
    console.error('Error fetching featured products:', error);
    return [];
  }

  const transformedProducts: LegacyProduct[] = (productsData || []).map((p: any) => ({
    id: p.slug || p.id,
    slug: p.slug || undefined,
    brand: p.brand as Brand,
    model: p.model || p.title,
    color: p.color || '',
    origin: p.origin || '',
    status: dbStatusToLegacy(p.status),
    price: p.price,
    category: p.category as any,
    image: p.product_images?.[0]?.url || '',
    badge: p.badge || undefined,
    description: p.description || undefined
  }));

  return transformedProducts;
}

export default async function Home() {
  const featured = await getFeaturedProducts();
  
  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-[#E85A9A] text-white text-center py-3 px-4">
        <p className="text-sm md:text-base flex flex-wrap items-center justify-center gap-2 md:gap-4">
          <span className="inline-flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Piezas verificadas
          </span>
          <span className="hidden md:inline">·</span>
          <span className="inline-flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Envíos seguros
          </span>
          <span className="hidden md:inline">·</span>
          <span className="inline-flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Aparta con pagos semanales
          </span>
        </p>
      </div>

      {/* Hero Premium */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background - usar gradient si no hay imagen, o primera imagen de productos */}
        <div className="absolute inset-0">
          {featured.length > 0 && featured[0].image ? (
            <>
              <img
                src={featured[0].image}
                alt="Bagclue Luxury"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#E85A9A]/20 via-[#0B0B0B] to-[#0B0B0B]" />
          )}
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <h1 className="font-[family-name:var(--font-playfair)] text-5xl md:text-7xl lg:text-8xl text-white tracking-wide mb-6 leading-tight">
            LUJO AUTÉNTICO,
            <span className="block mt-2">CURADO PARA TI</span>
          </h1>

          <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
            Piezas de diseñador seleccionadas, verificadas y listas para acompañarte en tu próxima historia.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/catalogo"
              className="inline-flex items-center gap-2 bg-[#E85A9A] text-white px-10 py-4 text-sm md:text-base tracking-widest uppercase font-medium hover:bg-[#EC5C9F] transition-all duration-300 rounded-full shadow-lg shadow-[#E85A9A]/30"
            >
              Ver Catálogo
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <a
              href="https://ig.me/m/salebybagcluemx"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 border-2 border-white/80 text-white px-10 py-4 text-sm md:text-base tracking-widest uppercase font-medium hover:bg-white/10 transition-all duration-300 rounded-full"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
              Hablar con Bagclue
            </a>
          </div>

          {/* Trust micro */}
          <div className="mt-10 flex items-center justify-center gap-2 text-white/70 text-sm">
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>100% autenticado por Entrupy</span>
          </div>
        </div>

        {/* Flecha scroll */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10">
          <div className="animate-bounce">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 md:py-32 bg-[#F7F7F7]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-[family-name:var(--font-playfair)] text-4xl md:text-5xl text-[#0B0B0B] mb-4">
              ¿Por qué Bagclue?
            </h2>
            <div className="w-20 h-1 bg-[#E85A9A] mx-auto mt-6" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
            {/* Autenticidad */}
            <div className="text-center bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-[#E85A9A]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-[#E85A9A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[#0B0B0B] mb-3">
                Autenticidad Verificada
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Cada pieza certificada por Entrupy, la tecnología líder mundial en autenticación de artículos de lujo.
              </p>
            </div>

            {/* Piezas Seleccionadas */}
            <div className="text-center bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-[#FFF4A8]/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-[#0B0B0B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[#0B0B0B] mb-3">
                Piezas Seleccionadas
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Selección curada de bolsas Chanel, Hermès, Louis Vuitton y más. Cada pieza con historia única.
              </p>
            </div>

            {/* Envíos */}
            <div className="text-center bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-[#E85A9A]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-[#E85A9A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[#0B0B0B] mb-3">
                Envíos Seguros
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Envío asegurado a todo México. Tu pieza llega protegida y con tracking completo.
              </p>
            </div>

            {/* Atención */}
            <div className="text-center bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-[#E85A9A]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-[#E85A9A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[#0B0B0B] mb-3">
                Atención Personalizada
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Respuesta rápida por Instagram. Te asesoramos en cada paso de tu compra.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs tracking-[0.5em] uppercase text-[#E85A9A]/60 mb-3 block">
              Colección
            </span>
            <h2 className="font-[family-name:var(--font-playfair)] text-4xl md:text-5xl text-[#0B0B0B] mb-4">
              Piezas Destacadas
            </h2>
            <div className="w-20 h-1 bg-[#E85A9A] mx-auto mt-6" />
          </div>

          {featured.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-10">
                {featured.slice(0, 4).map(p => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              <div className="text-center mt-16">
                <Link
                  href="/catalogo"
                  className="inline-flex items-center gap-2 border-2 border-[#E85A9A]/40 text-[#E85A9A] px-10 py-4 text-sm tracking-widest uppercase font-medium hover:bg-[#E85A9A]/5 transition-all duration-300 rounded-full"
                >
                  Ver Catálogo Completo
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-500">Nuevas piezas próximamente...</p>
            </div>
          )}
        </div>
      </section>

      {/* Apartado Section */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-[#E85A9A]/5 to-transparent">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Imagen - usar primera imagen de productos si existe */}
            <div className="order-2 lg:order-1">
              {featured.length > 0 && featured[0].image ? (
                <img
                  src={featured[0].image}
                  alt="Aparta tu pieza"
                  className="rounded-2xl shadow-xl w-full h-auto"
                />
              ) : (
                <div className="w-full aspect-square rounded-2xl bg-gradient-to-br from-[#E85A9A]/20 to-[#E85A9A]/5 flex items-center justify-center">
                  <p className="text-gray-400">Imagen próximamente</p>
                </div>
              )}
            </div>

            {/* Contenido */}
            <div className="order-1 lg:order-2">
              <span className="text-xs tracking-[0.5em] uppercase text-[#E85A9A]/60 mb-3 block">
                Apartado
              </span>
              <h2 className="font-[family-name:var(--font-playfair)] text-4xl md:text-5xl text-[#0B0B0B] mb-6">
                Aparta tu pieza Bagclue
              </h2>
              <p className="text-lg text-gray-600 mb-10 leading-relaxed">
                Una forma flexible y segura de adquirir piezas de lujo sin perder la oportunidad.
              </p>

              {/* 3 Pasos */}
              <div className="space-y-6 mb-10">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#E85A9A] text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#0B0B0B] mb-1">
                      Elige tu pieza
                    </h3>
                    <p className="text-sm text-gray-600">
                      Encuentra la bolsa perfecta en nuestro catálogo verificado.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#E85A9A] text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#0B0B0B] mb-1">
                      Aparta con pagos semanales
                    </h3>
                    <p className="text-sm text-gray-600">
                      Define tu plan de pagos semanal que mejor se ajuste a ti.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#E85A9A] text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#0B0B0B] mb-1">
                      Recíbela al completar tu pago
                    </h3>
                    <p className="text-sm text-gray-600">
                      Tu pieza te espera asegurada hasta que termines tus pagos.
                    </p>
                  </div>
                </div>
              </div>

              <Link
                href="/apartado"
                className="inline-flex items-center gap-2 bg-[#E85A9A] text-white px-10 py-4 text-sm tracking-widest uppercase font-medium hover:bg-[#EC5C9F] transition-all duration-300 rounded-full"
              >
                Conocer Más
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Instagram/Asesoría CTA */}
      <section className="py-20 md:py-32 bg-[#0B0B0B] text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-[family-name:var(--font-playfair)] text-4xl md:text-5xl mb-6">
            ¿Necesitas Ayuda?
          </h2>
          <p className="text-lg md:text-xl text-white/80 mb-10 leading-relaxed">
            Nuestro equipo está listo para asesorarte en la elección de tu pieza perfecta. Contáctanos por Instagram.
          </p>

          <a
            href="https://ig.me/m/salebybagcluemx"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-[#E85A9A] text-white px-10 py-4 text-sm tracking-widest uppercase font-medium hover:bg-[#EC5C9F] transition-all duration-300 rounded-full shadow-lg shadow-[#E85A9A]/30"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
            Hablar con Bagclue
          </a>

          <div className="mt-10 text-white/60 text-sm">
            <p>Respuesta rápida · Asesoría personalizada · Sin compromiso</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#F7F7F7] py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            {/* Logo */}
            <div>
              <h3 className="font-[family-name:var(--font-playfair)] text-2xl text-[#0B0B0B] mb-4">
                Bagclue
              </h3>
              <p className="text-sm text-gray-600">
                Lujo auténtico, curado para ti.
              </p>
            </div>

            {/* Navegación */}
            <div>
              <h4 className="text-sm tracking-widest uppercase text-[#0B0B0B] mb-4 font-semibold">
                Navegar
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/catalogo" className="hover:text-[#E85A9A]">Catálogo</Link></li>
                <li><Link href="/apartado" className="hover:text-[#E85A9A]">Apartado</Link></li>
                <li><Link href="/account" className="hover:text-[#E85A9A]">Mi Cuenta</Link></li>
              </ul>
            </div>

            {/* Confianza */}
            <div>
              <h4 className="text-sm tracking-widest uppercase text-[#0B0B0B] mb-4 font-semibold">
                Confianza
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Verificado por Entrupy
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Envíos seguros
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Atención personalizada
                </li>
              </ul>
            </div>

            {/* Contacto */}
            <div>
              <h4 className="text-sm tracking-widest uppercase text-[#0B0B0B] mb-4 font-semibold">
                Contacto
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <a href="https://ig.me/m/salebybagcluemx" target="_blank" rel="noopener noreferrer" className="hover:text-[#E85A9A] inline-flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                    </svg>
                    @salebybagcluemx
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-300 pt-8 text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} Bagclue. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </>
  );
}

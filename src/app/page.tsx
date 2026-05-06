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
      {/* 1. Hero Premium */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background limpio premium - degradado rosa suave + amarillo pastel */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#FFF9F5] via-[#FFFBF8] to-[#FFF4F9]">
          {/* Detalles decorativos sutiles */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#E85A9A]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#FFF4A8]/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#E85A9A]/3 rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <h1 className="font-[family-name:var(--font-playfair)] text-5xl md:text-7xl lg:text-8xl text-[#0B0B0B] tracking-wide mb-6 leading-tight">
            TU PRÓXIMA PIEZA DE LUJO
            <span className="block mt-2">EMPIEZA AQUÍ</span>
          </h1>

          <p className="text-lg md:text-xl text-[#0B0B0B]/80 mb-10 max-w-2xl mx-auto leading-relaxed">
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
              className="inline-flex items-center gap-3 border-2 border-[#E85A9A]/40 text-[#E85A9A] px-10 py-4 text-sm md:text-base tracking-widest uppercase font-medium hover:bg-[#E85A9A]/5 transition-all duration-300 rounded-full"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
              Hablar con Bagclue
            </a>
          </div>

          {/* Trust micro */}
          <div className="mt-10 flex items-center justify-center gap-2 text-[#0B0B0B]/60 text-sm">
            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>100% autenticado por Entrupy</span>
          </div>
        </div>

        {/* Flecha scroll */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10">
          <div className="animate-bounce">
            <svg className="w-8 h-8 text-[#E85A9A]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* 2. Recién Llegadas / Featured Products */}
      <section className="py-20 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-[family-name:var(--font-playfair)] text-4xl md:text-5xl text-[#0B0B0B] mb-4">
              Recién llegadas a Bagclue
            </h2>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto mb-6">
              Piezas seleccionadas, verificadas y listas para encontrar nueva dueña.
            </p>
            <div className="w-20 h-1 bg-[#E85A9A] mx-auto" />
          </div>

          {featured.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
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

      {/* 3. Comprar por Marca / Categoría */}
      <section className="py-20 md:py-32 bg-[#F7F7F7]">
        <div className="max-w-7xl mx-auto px-6">
          {/* Comprar por Marca */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl text-[#0B0B0B] mb-4">
                Comprar por Marca
              </h2>
              <div className="w-20 h-1 bg-[#E85A9A] mx-auto" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {['Chanel', 'Hermès', 'Louis Vuitton', 'Dior', 'Goyard'].map(brand => (
                <Link
                  key={brand}
                  href="/catalogo"
                  className="group bg-white p-8 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col items-center justify-center text-center min-h-[160px]"
                >
                  <h3 className="font-[family-name:var(--font-playfair)] text-xl md:text-2xl text-[#0B0B0B] group-hover:text-[#E85A9A] transition-colors">
                    {brand}
                  </h3>
                  <svg className="w-5 h-5 text-[#E85A9A] mt-4 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>

          {/* Comprar por Categoría */}
          <div>
            <div className="text-center mb-12">
              <h2 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl text-[#0B0B0B] mb-4">
                Comprar por Categoría
              </h2>
              <div className="w-20 h-1 bg-[#E85A9A] mx-auto" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { name: 'Bolsas', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
                { name: 'Zapatos', icon: 'M3 10h10a8 8 0 018 8v2M3 10l6 12v-12' },
                { name: 'Joyería', icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
                { name: 'Accesorios', icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343' }
              ].map(cat => (
                <Link
                  key={cat.name}
                  href="/catalogo"
                  className="group bg-white p-8 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col items-center justify-center text-center"
                >
                  <svg className="w-12 h-12 text-[#E85A9A] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={cat.icon} />
                  </svg>
                  <h3 className="text-lg font-semibold text-[#0B0B0B] group-hover:text-[#E85A9A] transition-colors">
                    {cat.name}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Confianza / Por qué Bagclue */}
      <section id="autenticidad" className="py-20 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-[family-name:var(--font-playfair)] text-4xl md:text-5xl text-[#0B0B0B] mb-4">
              ¿Por qué Bagclue?
            </h2>
            <div className="w-20 h-1 bg-[#E85A9A] mx-auto mt-6" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
            {/* Autenticidad */}
            <div className="text-center bg-[#F7F7F7] p-8 rounded-2xl">
              <div className="w-16 h-16 bg-[#E85A9A]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-[#E85A9A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[#0B0B0B] mb-3">
                Autenticidad Verificada
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Cada pieza certificada por Entrupy.
              </p>
            </div>

            {/* Piezas Seleccionadas */}
            <div className="text-center bg-[#F7F7F7] p-8 rounded-2xl">
              <div className="w-16 h-16 bg-[#FFF4A8]/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-[#0B0B0B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[#0B0B0B] mb-3">
                Piezas Seleccionadas
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Selección curada de las mejores marcas de lujo.
              </p>
            </div>

            {/* Envíos */}
            <div className="text-center bg-[#F7F7F7] p-8 rounded-2xl">
              <div className="w-16 h-16 bg-[#E85A9A]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-[#E85A9A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[#0B0B0B] mb-3">
                Envíos Seguros
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Envío asegurado a todo México con tracking.
              </p>
            </div>

            {/* Atención */}
            <div className="text-center bg-[#F7F7F7] p-8 rounded-2xl">
              <div className="w-16 h-16 bg-[#E85A9A]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-[#E85A9A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[#0B0B0B] mb-3">
                Atención Personalizada
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Respuesta rápida por Instagram.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Apartado Section */}
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

      {/* 6. Asesoría / Instagram CTA */}
      <section className="py-20 md:py-32 bg-[#0B0B0B] text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-[family-name:var(--font-playfair)] text-4xl md:text-5xl mb-6">
            ¿Necesitas ayuda para elegir tu pieza?
          </h2>
          <p className="text-lg md:text-xl text-white/80 mb-10 leading-relaxed">
            Te acompañamos para resolver dudas sobre condición, autenticidad, apartado y envío.
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

    </>
  );
}

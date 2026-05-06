import { notFound } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Product, dbStatusToLegacy } from '@/types/database';
import { brandGradients, formatPrice, type Brand } from '@/data/products';
import ProductCard from '@/components/ProductCard';
import ProductGallery from '@/components/ProductGallery';
import AddToCartButton from '@/components/AddToCartButton';
import LayawayButton from '@/components/LayawayButton';
import { PRODUCT_PUBLIC_FIELDS } from '@/lib/products-public-fields';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const dynamicParams = true;

async function getProduct(slug: string) {
  const { data: product, error } = await supabase
    .from('products')
    .select(`${PRODUCT_PUBLIC_FIELDS}, product_images(*)`)
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (error || !product) return null;
  return product;
}

async function getRelatedProducts(brand: string, currentSlug: string) {
  const { data: products } = await supabase
    .from('products')
    .select(`${PRODUCT_PUBLIC_FIELDS}, product_images(*)`)
    .eq('brand', brand)
    .eq('is_published', true)
    .neq('slug', currentSlug)
    .limit(4);

  return products || [];
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: slug } = await params;
  const productData = await getProduct(slug);
  
  if (!productData) notFound();

  // Normalize product data
  const rawProduct = productData as any;
  const product = {
    id: rawProduct.id || '',
    slug: rawProduct.slug || slug,
    title: typeof rawProduct.title === 'string' ? rawProduct.title : '',
    brand: typeof rawProduct.brand === 'string' ? rawProduct.brand : '',
    model: typeof rawProduct.model === 'string' ? rawProduct.model : null,
    color: typeof rawProduct.color === 'string' ? rawProduct.color : null,
    origin: typeof rawProduct.origin === 'string' ? rawProduct.origin : null,
    material: typeof rawProduct.material === 'string' ? rawProduct.material : null,
    status: rawProduct.status,
    condition: typeof rawProduct.condition === 'string' ? rawProduct.condition : 'new',
    condition_notes: typeof rawProduct.condition_notes === 'string' ? rawProduct.condition_notes : null,
    price: typeof rawProduct.price === 'number' ? rawProduct.price : null,
    currency: typeof rawProduct.currency === 'string' ? rawProduct.currency : 'MXN',
    category: typeof rawProduct.category === 'string' ? rawProduct.category : '',
    badge: typeof rawProduct.badge === 'string' ? rawProduct.badge : null,
    description: typeof rawProduct.description === 'string' ? rawProduct.description : null,
    is_published: typeof rawProduct.is_published === 'boolean' ? rawProduct.is_published : false,
    includes_box: typeof rawProduct.includes_box === 'boolean' ? rawProduct.includes_box : false,
    includes_dust_bag: typeof rawProduct.includes_dust_bag === 'boolean' ? rawProduct.includes_dust_bag : false,
    includes_papers: typeof rawProduct.includes_papers === 'boolean' ? rawProduct.includes_papers : false,
    included_accessories: typeof rawProduct.included_accessories === 'string' ? rawProduct.included_accessories : null,
    authenticity_verified: typeof rawProduct.authenticity_verified === 'boolean' ? rawProduct.authenticity_verified : false,
    stock: typeof rawProduct.stock === 'number' ? rawProduct.stock : 0,
    allow_layaway: typeof rawProduct.allow_layaway === 'boolean' ? rawProduct.allow_layaway : true,
    layaway_deposit_percent: typeof rawProduct.layaway_deposit_percent === 'number' ? rawProduct.layaway_deposit_percent : 20,
    product_images: Array.isArray(rawProduct.product_images) ? rawProduct.product_images.sort((a: any, b: any) => a.position - b.position) : []
  };

  const relatedData = await getRelatedProducts(product.brand, slug);
  
  const gradient = brandGradients[product.brand as Brand] || { from: '#1a1a1a', to: '#4A4A4A' };
  const legacyStatus = dbStatusToLegacy(product.status);
  const currentImage = product.product_images[0]?.url || '';

  // Transform related products
  const related = relatedData.map((p: any) => ({
    id: p.slug || p.id || '',
    brand: typeof p.brand === 'string' ? p.brand : '',
    model: typeof p.model === 'string' ? p.model : (typeof p.title === 'string' ? p.title : ''),
    color: typeof p.color === 'string' ? p.color : '',
    origin: typeof p.origin === 'string' ? p.origin : '',
    status: dbStatusToLegacy(p.status),
    price: typeof p.price === 'number' ? p.price : null,
    category: typeof p.category === 'string' ? p.category : '',
    image: p.product_images?.[0]?.url || '',
    badge: typeof p.badge === 'string' ? p.badge : undefined,
    description: typeof p.description === 'string' ? p.description : undefined
  }));

  return (
    <div className="py-20 md:py-32 md:pb-40 bg-white">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[#0B0B0B]/30 mb-8">
          <Link href="/" className="hover:text-[#E85A9A] transition-colors">Inicio</Link>
          <span>/</span>
          <Link href="/catalogo" className="hover:text-[#E85A9A] transition-colors">Catálogo</Link>
          <span>/</span>
          <span className="text-[#0B0B0B]/50">{product.slug}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-12 lg:gap-16">
          {/* GALERÍA (55%) */}
          <ProductGallery 
            images={product.product_images}
            gradient={gradient}
            brand={product.brand}
            title={product.title}
            status={product.status}
            badge={product.badge}
          />

          {/* INFORMACIÓN (45%) */}
          <div className="flex flex-col">
            {/* Marca */}
            <p className="font-[family-name:var(--font-inter)] text-xs uppercase tracking-[0.20em] text-[#E85A9A]/60 mb-2">
              {product.brand}
            </p>

            {/* Título */}
            <h1 className="font-[family-name:var(--font-playfair)] text-4xl md:text-5xl text-[#0B0B0B] tracking-tight leading-tight mb-6">
              {product.title}
            </h1>

            {/* Precio */}
            <div className="mb-8">
              <span className={`font-[family-name:var(--font-playfair)] text-3xl md:text-4xl font-bold ${product.price ? 'text-[#E85A9A]' : 'text-[#0B0B0B]/50'}`}>
                {formatPrice(product.price)}
              </span>
              {!product.price && (
                <p className="text-sm text-[#0B0B0B]/60 mt-2">
                  Escríbenos por Instagram para consultar el precio
                </p>
              )}
            </div>

            {/* Trust badge Entrupy (destacado ANTES de CTAs) */}
            {product.authenticity_verified && (
              <div className="mb-8 p-4 bg-emerald-50 border border-emerald-200/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-700">Autenticidad verificada</p>
                    <p className="text-xs text-emerald-600">Certificado por Entrupy</p>
                  </div>
                </div>
              </div>
            )}

            {/* CTAs por status */}
            <div className="space-y-3 mb-12">
              {product.status === 'available' && product.is_published && (product.stock ?? 0) > 0 && product.price ? (
                <>
                  <AddToCartButton 
                    product={{
                      id: product.id,
                      slug: product.slug,
                      title: product.title,
                      brand: product.brand,
                      price: product.price,
                      currency: product.currency,
                      status: product.status,
                      image: currentImage
                    }}
                  />
                  {product.allow_layaway && (
                    <LayawayButton 
                      product={{
                        id: product.id,
                        price: product.price,
                        layaway_deposit_percent: product.layaway_deposit_percent,
                        currency: product.currency
                      }}
                    />
                  )}
                </>
              ) : product.status === 'sold' ? (
                <>
                  <div className="w-full border-2 border-gray-200 text-gray-400 py-4 text-center cursor-not-allowed rounded-lg">
                    <span className="block text-lg font-medium">Vendida</span>
                    <span className="block text-xs mt-1">Esta pieza ya encontró nueva dueña</span>
                  </div>
                  <Link
                    href="/catalogo"
                    className="block w-full border-2 border-[#E85A9A]/40 text-[#E85A9A] py-3 text-center hover:bg-[#E85A9A]/5 transition-colors rounded-lg"
                  >
                    Ver catálogo completo
                  </Link>
                </>
              ) : product.status === 'reserved' ? (
                <>
                  <div className="w-full border-2 border-amber-200 bg-amber-50 text-amber-700 py-4 text-center rounded-lg">
                    <span className="block text-lg font-medium">Apartada</span>
                    <span className="block text-xs mt-1">Esta pieza está en proceso de apartado</span>
                  </div>
                  <Link
                    href="/catalogo"
                    className="block w-full border-2 border-[#E85A9A]/40 text-[#E85A9A] py-3 text-center hover:bg-[#E85A9A]/5 transition-colors rounded-lg"
                  >
                    Ver otras piezas
                  </Link>
                </>
              ) : product.status === 'preorder' ? (
                <a
                  href="https://ig.me/m/salebybagcluemx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-[#E85A9A] text-white py-4 text-center hover:bg-[#EC5C9F] transition-colors rounded-lg"
                >
                  Consultar pre-venta por Instagram
                </a>
              ) : !product.price ? (
                <a
                  href="https://ig.me/m/salebybagcluemx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-[#E85A9A] text-white py-4 text-center hover:bg-[#EC5C9F] transition-colors rounded-lg"
                >
                  Consultar precio por Instagram
                </a>
              ) : (
                <a
                  href="https://ig.me/m/salebybagcluemx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-[#E85A9A] text-white py-4 text-center hover:bg-[#EC5C9F] transition-colors rounded-lg"
                >
                  Consultar por Instagram
                </a>
              )}
            </div>

            {/* SECCIONES EDITORIALES */}

            {/* A. Detalles de la pieza */}
            <div className="mb-8">
              <h3 className="font-[family-name:var(--font-inter)] text-sm uppercase tracking-[0.16em] text-[#0B0B0B] mb-4 flex items-center gap-2">
                <span>📦</span> Detalles de la pieza
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#0B0B0B]/60">Marca</span>
                  <span className="text-[#0B0B0B] font-medium">{product.brand}</span>
                </div>
                {product.model && (
                  <div className="flex justify-between">
                    <span className="text-[#0B0B0B]/60">Modelo</span>
                    <span className="text-[#0B0B0B] font-medium">{product.model}</span>
                  </div>
                )}
                {product.color && (
                  <div className="flex justify-between">
                    <span className="text-[#0B0B0B]/60">Color</span>
                    <span className="text-[#0B0B0B] font-medium">{product.color}</span>
                  </div>
                )}
                {product.material && (
                  <div className="flex justify-between">
                    <span className="text-[#0B0B0B]/60">Material</span>
                    <span className="text-[#0B0B0B] font-medium">{product.material}</span>
                  </div>
                )}
                {product.origin && (
                  <div className="flex justify-between">
                    <span className="text-[#0B0B0B]/60">Origen</span>
                    <span className="text-[#0B0B0B] font-medium">{product.origin}</span>
                  </div>
                )}
                {product.category && (
                  <div className="flex justify-between">
                    <span className="text-[#0B0B0B]/60">Categoría</span>
                    <span className="text-[#0B0B0B] font-medium capitalize">{product.category}</span>
                  </div>
                )}
              </div>
            </div>

            {/* B. Condición */}
            <div className="mb-8">
              <h3 className="font-[family-name:var(--font-inter)] text-sm uppercase tracking-[0.16em] text-[#0B0B0B] mb-4 flex items-center gap-2">
                <span>✨</span> Condición
              </h3>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="text-[#0B0B0B]/60">Estado: </span>
                  <span className="text-[#0B0B0B] font-medium capitalize">
                    {product.condition.replace('_', ' ')}
                  </span>
                </p>
                {product.condition_notes && (
                  <p className="text-sm text-[#0B0B0B]/70 leading-relaxed">
                    {product.condition_notes}
                  </p>
                )}
                {product.description && (
                  <p className="text-sm text-[#0B0B0B]/70 leading-relaxed italic">
                    {product.description}
                  </p>
                )}
              </div>
            </div>

            {/* C. Qué incluye */}
            <div className="mb-8">
              <h3 className="font-[family-name:var(--font-inter)] text-sm uppercase tracking-[0.16em] text-[#0B0B0B] mb-4 flex items-center gap-2">
                <span>📋</span> Qué incluye
              </h3>
              <ul className="space-y-2 text-sm">
                {product.includes_box && (
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-[#0B0B0B]/80">Caja original</span>
                  </li>
                )}
                {product.includes_dust_bag && (
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-[#0B0B0B]/80">Dust bag</span>
                  </li>
                )}
                {product.includes_papers && (
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-[#0B0B0B]/80">Papeles y certificados</span>
                  </li>
                )}
                {product.included_accessories && (
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-[#0B0B0B]/80">{product.included_accessories}</span>
                  </li>
                )}
                {!product.includes_box && !product.includes_dust_bag && !product.includes_papers && !product.included_accessories && (
                  <li className="text-[#0B0B0B]/60 italic">Solo la pieza</li>
                )}
              </ul>
            </div>

            {/* D. Autenticidad */}
            {!product.authenticity_verified && (
              <div className="mb-8">
                <h3 className="font-[family-name:var(--font-inter)] text-sm uppercase tracking-[0.16em] text-[#0B0B0B] mb-4 flex items-center gap-2">
                  <span>🔒</span> Autenticidad
                </h3>
                <p className="text-sm text-[#0B0B0B]/70 leading-relaxed">
                  Todas nuestras piezas son auténticas. Verificación disponible bajo solicitud.
                </p>
              </div>
            )}

            {/* E. Envío y apartado */}
            <div className="mb-8">
              <h3 className="font-[family-name:var(--font-inter)] text-sm uppercase tracking-[0.16em] text-[#0B0B0B] mb-4 flex items-center gap-2">
                <span>🚚</span> Envío y apartado
              </h3>
              <div className="space-y-3 text-sm text-[#0B0B0B]/70">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-[#E85A9A] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p>Envío asegurado a todo México</p>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-[#E85A9A] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p>Tracking en tiempo real</p>
                </div>
                {product.allow_layaway && (
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-[#E85A9A] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p>Apartado disponible con pagos semanales</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div className="mt-32 border-t border-[#E85A9A]/10 pt-20">
            <h2 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl text-[#0B0B0B] mb-12 text-center tracking-tight leading-tight">
              También te puede interesar
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
              {related.map((p: any) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

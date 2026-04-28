import { notFound } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Product, dbStatusToLegacy } from '@/types/database';
import { brandGradients, formatPrice, getStatusColor, getStatusLabel, type Brand } from '@/data/products';
import ProductCard from '@/components/ProductCard';
import InstagramCTA from '@/components/InstagramCTA';
import AddToCartButton from '@/components/AddToCartButton';

export const dynamic = 'force-dynamic'; // Disable static generation for now

async function getProduct(slug: string) {
  const { data: product, error } = await supabase
    .from('products')
    .select('*, product_images(*)')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (error || !product) return null;
  return product;
}

async function getRelatedProducts(brand: string, currentSlug: string) {
  const { data: products } = await supabase
    .from('products')
    .select('*, product_images(*)')
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

  const product = productData as any;
  const relatedData = await getRelatedProducts(product.brand, slug);
  
  const gradient = brandGradients[product.brand as Brand] || { from: '#1a1a1a', to: '#4A4A4A' };
  const legacyStatus = dbStatusToLegacy(product.status);
  const mainImage = product.product_images?.[0]?.url || '';

  // Transform related products to legacy format for ProductCard
  const related = relatedData.map((p: any) => ({
    id: p.slug,
    brand: p.brand,
    model: p.model || p.title,
    color: p.color || '',
    origin: p.origin || '',
    status: dbStatusToLegacy(p.status),
    price: p.price,
    category: p.category,
    image: p.product_images?.[0]?.url || '',
    badge: p.badge || undefined,
    description: p.description || undefined
  }));

  return (
    <div className="pt-28 pb-24">
      <div className="max-w-6xl mx-auto px-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-900/30 mb-8">
          <Link href="/" className="hover:text-[#FF69B4]">Inicio</Link>
          <span>/</span>
          <Link href="/catalogo" className="hover:text-[#FF69B4]">Catálogo</Link>
          <span>/</span>
          <span className="text-gray-900/50">{slug}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image */}
          <div
            className="aspect-[3/4] relative overflow-hidden border border-[#FF69B4]/10"
            style={{ background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` }}
          >
            {mainImage ? (
              <img
                src={mainImage}
                alt={product.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-[family-name:var(--font-playfair)] text-5xl text-gray-900/10 tracking-widest">{product.brand}</span>
                <span className="text-sm text-gray-900/20 mt-4 tracking-wider">Imagen próximamente</span>
              </div>
            )}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <span className={`text-xs tracking-wider uppercase px-3 py-1.5 border ${getStatusColor(legacyStatus)}`}>
                {getStatusLabel(legacyStatus)}
              </span>
              {product.badge && (
                <span className="text-xs tracking-wider uppercase px-3 py-1.5 border bg-[#FF69B4]/20 text-[#FF69B4] border-[#FF69B4]/30">
                  🔥 {product.badge}
                </span>
              )}
            </div>
            <div className="absolute top-4 right-4">
              <span className="text-[10px] tracking-wider bg-white/70 text-emerald-400 px-2.5 py-1.5 border border-emerald-500/20">
                ✓ AUTENTICIDAD VERIFICADA · ENTRUPY
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col justify-center">
            <span className="text-xs tracking-[0.5em] uppercase text-[#FF69B4]/60">{product.brand}</span>
            <h1 className="font-[family-name:var(--font-playfair)] text-4xl md:text-5xl text-gray-900 mt-2 mb-4">{product.title}</h1>

            {product.description && (
              <p className="text-sm text-gray-900/60 leading-relaxed mb-6 italic">{product.description}</p>
            )}

            <div className="space-y-4 mb-8">
              <div className="flex justify-between border-b border-[#FF69B4]/10 pb-3">
                <span className="text-sm text-gray-900/40">Código</span>
                <span className="text-sm text-gray-900">{slug}</span>
              </div>
              <div className="flex justify-between border-b border-[#FF69B4]/10 pb-3">
                <span className="text-sm text-gray-900/40">Marca</span>
                <span className="text-sm text-gray-900">{product.brand}</span>
              </div>
              {product.model && (
                <div className="flex justify-between border-b border-[#FF69B4]/10 pb-3">
                  <span className="text-sm text-gray-900/40">Modelo</span>
                  <span className="text-sm text-gray-900">{product.model}</span>
                </div>
              )}
              {product.color && (
                <div className="flex justify-between border-b border-[#FF69B4]/10 pb-3">
                  <span className="text-sm text-gray-900/40">Color</span>
                  <span className="text-sm text-gray-900">{product.color}</span>
                </div>
              )}
              {product.origin && (
                <div className="flex justify-between border-b border-[#FF69B4]/10 pb-3">
                  <span className="text-sm text-gray-900/40">Origen</span>
                  <span className="text-sm text-gray-900">{product.origin}</span>
                </div>
              )}
              <div className="flex justify-between border-b border-[#FF69B4]/10 pb-3">
                <span className="text-sm text-gray-900/40">Estado</span>
                <span className={`text-xs tracking-wider uppercase px-2.5 py-1 border ${getStatusColor(legacyStatus)}`}>
                  {getStatusLabel(legacyStatus)}
                </span>
              </div>
              <div className="flex justify-between border-b border-[#FF69B4]/10 pb-3">
                <span className="text-sm text-gray-900/40">Condición</span>
                <span className="text-sm text-gray-900 capitalize">{product.condition.replace('_', ' ')}</span>
              </div>
            </div>

            <div className="mb-8">
              <span className={`font-[family-name:var(--font-playfair)] text-3xl ${product.price ? 'text-[#FF69B4]' : 'text-gray-900/50'}`}>
                {formatPrice(product.price)}
              </span>
              {!product.price && (
                <p className="text-xs text-gray-900/40 mt-2">Escríbenos por Instagram para consultar el precio</p>
              )}
            </div>

            {legacyStatus !== 'Apartada' && (
              <div className="mb-6 p-4 border border-[#FF69B4]/10 bg-[#FF69B4]/5">
                <p className="text-xs text-[#FF69B4]">💎 Apartado disponible — Llévate esta pieza con pagos semanales</p>
              </div>
            )}

            {/* CTA Logic */}
            {product.status === 'available' && product.is_published && (product.stock ?? 0) > 0 && product.price ? (
              <AddToCartButton 
                product={{
                  id: product.id,
                  slug: product.slug,
                  title: product.title,
                  brand: product.brand,
                  price: product.price,
                  currency: product.currency || 'MXN',
                  status: product.status,
                  image: mainImage
                }}
              />
            ) : product.status === 'preorder' ? (
              <InstagramCTA text="Consultar pre-venta" />
            ) : product.status === 'reserved' ? (
              <InstagramCTA text="Apartada / Consultar disponibilidad" />
            ) : product.status === 'sold' ? (
              <div className="w-full border border-gray-300 text-gray-400 py-3 text-center cursor-not-allowed">
                Vendida
              </div>
            ) : !product.price ? (
              <InstagramCTA text="Consultar precio" />
            ) : (
              <InstagramCTA text="Consultar por Instagram" />
            )}

            <div className="mt-6 flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full" />
              <span className="text-xs text-emerald-400/70">Autenticidad verificada por Entrupy</span>
            </div>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-24 border-t border-[#FF69B4]/10 pt-16">
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl text-gray-900 mb-8 text-center">Piezas Relacionadas</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((p: any) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

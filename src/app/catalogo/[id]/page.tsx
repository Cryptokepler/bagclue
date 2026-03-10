import { notFound } from 'next/navigation';
import Link from 'next/link';
import { products, brandGradients, formatPrice, getStatusColor, getStatusLabel } from '@/data/products';
import ProductCard from '@/components/ProductCard';
import InstagramCTA from '@/components/InstagramCTA';

export function generateStaticParams() {
  return products.map(p => ({ id: p.id }));
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = products.find(p => p.id === id);
  if (!product) notFound();

  const gradient = brandGradients[product.brand];
  const related = products.filter(p => p.id !== product.id && p.brand === product.brand).slice(0, 4);

  return (
    <div className="pt-28 pb-24">
      <div className="max-w-6xl mx-auto px-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[#F5F0EB]/30 mb-8">
          <Link href="/" className="hover:text-[#E91E8C]">Inicio</Link>
          <span>/</span>
          <Link href="/catalogo" className="hover:text-[#E91E8C]">Catálogo</Link>
          <span>/</span>
          <span className="text-[#F5F0EB]/50">{product.id}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image */}
          <div
            className="aspect-[3/4] relative overflow-hidden border border-[#E91E8C]/10"
            style={{ background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` }}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-[family-name:var(--font-playfair)] text-5xl text-white/10 tracking-widest">{product.brand}</span>
              <span className="text-sm text-white/20 mt-4 tracking-wider">Imagen próximamente</span>
            </div>
            <div className="absolute top-4 left-4">
              <span className={`text-xs tracking-wider uppercase px-3 py-1.5 border ${getStatusColor(product.status)}`}>
                {getStatusLabel(product.status)}
              </span>
            </div>
            <div className="absolute top-4 right-4">
              <span className="text-[10px] tracking-wider bg-[#0A0A0A]/70 text-emerald-400 px-2.5 py-1.5 border border-emerald-500/20">
                ✓ AUTENTICIDAD VERIFICADA · ENTRUPY
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col justify-center">
            <span className="text-xs tracking-[0.5em] uppercase text-[#E91E8C]/60">{product.brand}</span>
            <h1 className="font-[family-name:var(--font-playfair)] text-4xl md:text-5xl text-[#F5F0EB] mt-2 mb-6">{product.model}</h1>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between border-b border-[#E91E8C]/10 pb-3">
                <span className="text-sm text-[#F5F0EB]/40">Código</span>
                <span className="text-sm text-[#F5F0EB]">{product.id}</span>
              </div>
              <div className="flex justify-between border-b border-[#E91E8C]/10 pb-3">
                <span className="text-sm text-[#F5F0EB]/40">Marca</span>
                <span className="text-sm text-[#F5F0EB]">{product.brand}</span>
              </div>
              <div className="flex justify-between border-b border-[#E91E8C]/10 pb-3">
                <span className="text-sm text-[#F5F0EB]/40">Color</span>
                <span className="text-sm text-[#F5F0EB]">{product.color}</span>
              </div>
              <div className="flex justify-between border-b border-[#E91E8C]/10 pb-3">
                <span className="text-sm text-[#F5F0EB]/40">Origen</span>
                <span className="text-sm text-[#F5F0EB]">{product.origin}</span>
              </div>
              <div className="flex justify-between border-b border-[#E91E8C]/10 pb-3">
                <span className="text-sm text-[#F5F0EB]/40">Estado</span>
                <span className={`text-xs tracking-wider uppercase px-2.5 py-1 border ${getStatusColor(product.status)}`}>
                  {getStatusLabel(product.status)}
                </span>
              </div>
            </div>

            <div className="mb-8">
              <span className={`font-[family-name:var(--font-playfair)] text-3xl ${product.price ? 'text-[#E91E8C]' : 'text-[#F5F0EB]/50'}`}>
                {formatPrice(product.price)}
              </span>
              {!product.price && (
                <p className="text-xs text-[#F5F0EB]/40 mt-2">Escríbenos por Instagram para consultar el precio</p>
              )}
            </div>

            {product.status !== 'Apartada' && (
              <div className="mb-6 p-4 border border-[#E91E8C]/10 bg-[#E91E8C]/5">
                <p className="text-xs text-[#E91E8C]">💎 Apartado disponible — Llévate esta pieza con pagos semanales</p>
              </div>
            )}

            <InstagramCTA text="Consultar por Instagram" />

            <div className="mt-6 flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full" />
              <span className="text-xs text-emerald-400/70">Autenticidad verificada por Entrupy</span>
            </div>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-24 border-t border-[#E91E8C]/10 pt-16">
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl text-[#F5F0EB] mb-8 text-center">Piezas Relacionadas</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import Link from 'next/link';
import { Product, brandGradients, formatPrice, getStatusLabel } from '@/data/products';
import Badge from './Badge';

export default function ProductCard({ product }: { product: Product }) {
  const defaultGradient = { from: '#1a1a1a', to: '#4A4A4A' };
  const gradient = product.brand in brandGradients 
    ? brandGradients[product.brand]
    : defaultGradient;

  return (
    <Link href={`/catalogo/${product.slug || product.id}`} className="group block">
      <div className="relative overflow-hidden bg-[#111111] border border-[#E85A9A]/10 hover:border-[#E85A9A]/30 transition-all duration-500">
        {/* Image area */}
        <div
          className="aspect-[3/4] relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` }}
        >
          {product.image ? (
            <img
              src={product.image}
              alt={`${product.brand} ${product.model} ${product.color}`}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-102"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#FFFBF8]">
              <span className="font-[family-name:var(--font-playfair)] text-3xl text-[#0B0B0B]/10 tracking-widest">{product.brand}</span>
              <span className="text-xs text-[#0B0B0B]/20 mt-2 tracking-wider">Imagen próximamente</span>
            </div>
          )}

          {/* Subtle brand overlay on image */}
          {product.image && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          )}

          {/* Hover overlay sutil - oscuro */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-700" />
          
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-700">
            <span className="text-[10px] tracking-[0.22em] uppercase text-white/90 px-3 py-1.5 border border-white/20 bg-black/40 backdrop-blur-sm">
              Ver pieza
            </span>
          </div>

          {/* Status badge - solo si NO es available */}
          {(product.status as string) !== 'available' && (product.status as string) !== 'En inventario' && (
            <div className="absolute top-3 left-3">
              <Badge 
                type={
                  (product.status as string) === 'sold' ? 'sold' :
                  (product.status as string) === 'reserved' ? 'reserved' :
                  (product.status as string) === 'Apartada' ? 'reserved' :
                  (product.status as string) === 'preorder' ? 'special' :
                  (product.status as string) === 'Pre-venta' ? 'special' :
                  'available'
                }
                label={
                  (product.status as string) === 'sold' ? 'Vendida' :
                  (product.status as string) === 'reserved' ? 'Apartada' :
                  (product.status as string) === 'Apartada' ? 'Apartada' :
                  (product.status as string) === 'preorder' ? 'Pre-venta' :
                  (product.status as string) === 'Pre-venta' ? 'Pre-venta' :
                  'Disponible'
                }
              />
            </div>
          )}

          {/* Entrupy badge - charcoal premium */}
          <div className="absolute top-3 right-3">
            <Badge type="auth" label="✓ Entrupy" />
          </div>
        </div>

        {/* Info - más ligera y espaciada */}
        <div className="px-4 py-3.5">
          {/* Marca */}
          <p className="font-[family-name:var(--font-inter)] text-[11px] uppercase tracking-[0.22em] font-medium text-[#E85A9A]/70">
            {product.brand}
          </p>
          
          {/* Modelo */}
          <h3 className="font-[family-name:var(--font-inter)] text-[15px] font-semibold text-white mt-2 leading-relaxed">
            {product.model}
          </h3>
          
          {/* Color · Origen */}
          <p className="font-[family-name:var(--font-inter)] text-xs text-white/70 mt-1.5">
            {product.color || 'N/A'} · {product.origin || 'N/A'}
          </p>
          
          {/* Precio - separado y elegante */}
          <div className="mt-4">
            {product.price && typeof product.price === 'number' ? (
              <div className="flex items-baseline gap-1.5">
                <span className="font-[family-name:var(--font-inter)] text-xl font-semibold text-[#E85A9A]">
                  ${product.price.toLocaleString('es-MX')}
                </span>
                <span className="font-[family-name:var(--font-inter)] text-xs uppercase tracking-[0.18em] text-white/60">
                  MXN
                </span>
              </div>
            ) : (
              <span className="font-[family-name:var(--font-inter)] text-sm text-gray-500 italic">
                Consultar precio
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

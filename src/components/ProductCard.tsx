import Link from 'next/link';
import { Product, brandGradients, formatPrice, getStatusLabel } from '@/data/products';
import Badge from './Badge';

export default function ProductCard({ product }: { product: Product }) {
  const gradient = brandGradients[product.brand];

  return (
    <Link href={`/catalogo/${product.slug || product.id}`} className="group block">
      <div className="relative overflow-hidden bg-[#0B0B0B] border border-[#E85A9A]/10 hover:border-[#E85A9A]/30 transition-all duration-500">
        {/* Image area */}
        <div
          className="aspect-[3/4] relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` }}
        >
          {product.image ? (
            <img
              src={product.image}
              alt={`${product.brand} ${product.model} ${product.color}`}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-103"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
              <span className="font-[family-name:var(--font-playfair)] text-3xl text-gray-900/10 tracking-widest">{product.brand}</span>
              <span className="text-xs text-gray-900/20 mt-2 tracking-wider">Imagen próximamente</span>
            </div>
          )}

          {/* Subtle brand overlay on image */}
          {product.image && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-white/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
            <span className="text-xs tracking-widest uppercase text-[#E85A9A] border border-[#E85A9A]/50 px-4 py-2 bg-white/80">Ver detalles</span>
          </div>

          {/* Status badge - solo si NO es "En inventario" */}
          {product.status !== 'En inventario' && (
            <div className="absolute top-3 left-3">
              <Badge 
                type={product.status === 'Apartada' ? 'reserved' : 'available'} 
                label={getStatusLabel(product.status)} 
              />
            </div>
          )}

          {/* Entrupy badge - más discreto */}
          <div className="absolute top-3 right-3">
            <Badge type="auth" label="✓" />
          </div>
        </div>

        {/* Info */}
        <div className="p-5">
          <p className="font-[family-name:var(--font-inter)] text-xs uppercase tracking-[0.20em] font-medium text-[#E85A9A]/70">{product.brand}</p>
          <h3 className="font-[family-name:var(--font-inter)] text-base font-semibold text-white mt-1 leading-snug">{product.model}</h3>
          <p className="font-[family-name:var(--font-inter)] text-xs text-gray-400 mt-1">{product.color} · {product.origin}</p>
          <div className="mt-3 flex items-center justify-between">
            <span className={`font-[family-name:var(--font-inter)] text-lg font-bold tracking-tight ${product.price ? 'text-[#E85A9A]' : 'text-gray-500 italic'}`}>
              {formatPrice(product.price)}
            </span>
            <span className="font-[family-name:var(--font-inter)] text-[10px] text-gray-600">{product.id}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

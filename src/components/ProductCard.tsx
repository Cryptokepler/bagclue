import Link from 'next/link';
import { Product, brandGradients, formatPrice, getStatusColor, getStatusLabel } from '@/data/products';

export default function ProductCard({ product }: { product: Product }) {
  const gradient = brandGradients[product.brand];

  return (
    <Link href={`/catalogo/${product.id}`} className="group block">
      <div className="relative overflow-hidden bg-[#111] border border-[#FF69B4]/10 hover:border-[#FF69B4]/30 transition-all duration-500">
        {/* Image placeholder */}
        <div
          className="aspect-[3/4] relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` }}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
            <span className="font-[family-name:var(--font-playfair)] text-3xl text-gray-900/10 tracking-widest">{product.brand}</span>
            <span className="text-xs text-gray-900/20 mt-2 tracking-wider">Imagen próximamente</span>
          </div>

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-white/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
            <span className="text-xs tracking-widest uppercase text-[#FF69B4] border border-[#FF69B4]/50 px-4 py-2">Ver detalles</span>
          </div>

          {/* Status badge */}
          <div className="absolute top-3 left-3">
            <span className={`text-[10px] tracking-wider uppercase px-2.5 py-1 border ${getStatusColor(product.status)}`}>
              {getStatusLabel(product.status)}
            </span>
          </div>

          {/* Entrupy badge */}
          <div className="absolute top-3 right-3">
            <span className="text-[9px] tracking-wider bg-white/70 text-emerald-400 px-2 py-1 border border-emerald-500/20">
              ✓ ENTRUPY
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <p className="text-[10px] tracking-widest uppercase text-[#FF69B4]/70">{product.brand}</p>
          <h3 className="font-[family-name:var(--font-playfair)] text-lg text-gray-900 mt-1">{product.model}</h3>
          <p className="text-xs text-gray-900/40 mt-1">{product.color} · {product.origin}</p>
          <div className="mt-3 flex items-center justify-between">
            <span className={`text-sm ${product.price ? 'text-[#FF69B4]' : 'text-gray-900/50 italic'}`}>
              {formatPrice(product.price)}
            </span>
            <span className="text-[10px] text-gray-900/30">{product.id}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

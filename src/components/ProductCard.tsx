import Link from 'next/link';
import { Product, brandGradients, formatPrice, getStatusColor, getStatusLabel } from '@/data/products';

export default function ProductCard({ product }: { product: Product }) {
  const gradient = brandGradients[product.brand];

  return (
    <Link href={`/catalogo/${product.id}`} className="group block">
      <div className="relative overflow-hidden bg-[#111] border border-[#C9A96E]/10 hover:border-[#C9A96E]/30 transition-all duration-500">
        {/* Image placeholder */}
        <div
          className="aspect-[3/4] relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` }}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
            <span className="font-[family-name:var(--font-playfair)] text-3xl text-white/10 tracking-widest">{product.brand}</span>
            <span className="text-xs text-white/20 mt-2 tracking-wider">Imagen próximamente</span>
          </div>

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-[#0A0A0A]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
            <span className="text-xs tracking-widest uppercase text-[#C9A96E] border border-[#C9A96E]/50 px-4 py-2">Ver detalles</span>
          </div>

          {/* Status badge */}
          <div className="absolute top-3 left-3">
            <span className={`text-[10px] tracking-wider uppercase px-2.5 py-1 border ${getStatusColor(product.status)}`}>
              {getStatusLabel(product.status)}
            </span>
          </div>

          {/* Entrupy badge */}
          <div className="absolute top-3 right-3">
            <span className="text-[9px] tracking-wider bg-[#0A0A0A]/70 text-emerald-400 px-2 py-1 border border-emerald-500/20">
              ✓ ENTRUPY
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <p className="text-[10px] tracking-widest uppercase text-[#C9A96E]/70">{product.brand}</p>
          <h3 className="font-[family-name:var(--font-playfair)] text-lg text-[#F5F0EB] mt-1">{product.model}</h3>
          <p className="text-xs text-[#F5F0EB]/40 mt-1">{product.color} · {product.origin}</p>
          <div className="mt-3 flex items-center justify-between">
            <span className={`text-sm ${product.price ? 'text-[#C9A96E]' : 'text-[#F5F0EB]/50 italic'}`}>
              {formatPrice(product.price)}
            </span>
            <span className="text-[10px] text-[#F5F0EB]/30">{product.id}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

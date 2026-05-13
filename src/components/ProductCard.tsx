import Link from 'next/link';
import Image from 'next/image';
import { Product, brandGradients, formatPrice, getStatusLabel } from '@/data/products';
import Badge from './Badge';

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/catalogo/${product.slug || product.id}`} className="group block">
      {/* Image container */}
      <div className="relative aspect-[3/4] rounded overflow-hidden mb-4 bg-[#F5F1ED]">
        {product.image ? (
          <Image
            src={product.image}
            alt={`${product.brand} ${product.model} ${product.color || ''}`}
            fill
            className="object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-[family-name:var(--font-cormorant)] text-2xl text-[#3A3431]/20 italic">{product.brand}</span>
            <span className="text-xs text-[#3A3431]/30 mt-2">Imagen próximamente</span>
          </div>
        )}

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
      </div>

      {/* Brand */}
      <p className="text-[#9B8F87] font-[family-name:var(--font-manrope)] text-[11px] font-medium tracking-[0.1em] uppercase mb-2">
        {product.brand}
      </p>

      {/* Title */}
      <h3 className="text-[#3A3431] font-[family-name:var(--font-cormorant)] font-medium text-xl leading-[1.3] mb-2 group-hover:text-[#E85A9A] transition-colors duration-300">
        {product.model}
      </h3>

      {/* Price */}
      {product.price && typeof product.price === 'number' ? (
        <p className="text-[#8B4852] font-[family-name:var(--font-manrope)] text-base font-semibold">
          ${product.price.toLocaleString('es-MX')} MXN
        </p>
      ) : (
        <p className="text-[#9B8F87] font-[family-name:var(--font-manrope)] text-sm italic">
          Consultar precio
        </p>
      )}
    </Link>
  );
}

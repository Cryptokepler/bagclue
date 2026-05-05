// src/components/admin/ProductCard.tsx
// Card de producto para mobile (responsive)

import { StatusBadge, PublishedBadge, CategoryBadge } from './ProductBadges'
import { ProductAlerts } from './ProductAlerts'
import { calculateProductMetrics, formatCurrency, formatMargin } from '@/lib/product-metrics'

interface ProductCardProps {
  product: any
}

export default function ProductCard({ product }: ProductCardProps) {
  const metrics = calculateProductMetrics(product)
  const hasImage = product.product_images && product.product_images.length > 0
  
  return (
    <div className="bg-white/5 border border-[#FF69B4]/20 p-4 hover:bg-white/10 transition-colors">
      <div className="flex gap-4">
        {/* Imagen */}
        <div className="flex-shrink-0">
          {hasImage ? (
            <img
              src={product.product_images[0].url}
              alt={product.title}
              className="w-20 h-20 object-cover border border-[#FF69B4]/20"
            />
          ) : (
            <div className="w-20 h-20 bg-white/5 border border-[#FF69B4]/20 flex items-center justify-center">
              <span className="text-xs text-gray-500">Sin img</span>
            </div>
          )}
        </div>
        
        {/* Contenido */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Título + Marca */}
          <div>
            <h3 className="text-white font-medium text-sm truncate" title={product.title}>
              {product.title}
            </h3>
            <p className="text-gray-400 text-xs">
              {product.brand || 'Sin marca'}{product.model ? ` • ${product.model}` : ''}
            </p>
          </div>
          
          {/* Categoría + Status */}
          <div className="flex gap-2 flex-wrap">
            <CategoryBadge category={product.category} />
            <StatusBadge status={product.status} />
            <PublishedBadge isPublished={product.is_published} />
          </div>
          
          {/* Precio + Margen */}
          <div className="flex justify-between items-center">
            <div>
              <div className="text-gray-400 text-xs">Precio</div>
              <div className="text-white font-medium">
                {product.price ? formatCurrency(product.price, product.currency) : 'Consultar'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-gray-400 text-xs">Margen</div>
              <div className={`font-medium ${
                metrics.marginColor === 'green' ? 'text-emerald-400' :
                metrics.marginColor === 'yellow' ? 'text-yellow-400' :
                metrics.marginColor === 'red' ? 'text-red-400' :
                'text-gray-400'
              }`}>
                {metrics.margin > 0 ? formatMargin(metrics.margin) : 'N/A'}
              </div>
            </div>
          </div>
          
          {/* Alertas */}
          <div>
            <ProductAlerts product={product} />
          </div>
          
          {/* Acciones */}
          <div className="flex gap-3 pt-2 border-t border-[#FF69B4]/10">
            <a
              href={`/admin/productos/${product.id}`}
              className="flex-1 text-center bg-[#FF69B4] text-[#0a0a0a] text-sm font-medium px-4 py-2 hover:bg-[#FF69B4]/90 transition-colors"
            >
              ✏️ Editar
            </a>
            {product.is_published && product.slug && (
              <a
                href={`/catalogo/${product.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center border border-[#FF69B4]/20 text-gray-300 text-sm px-4 py-2 hover:border-[#FF69B4] transition-colors"
              >
                👁️ Ver
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

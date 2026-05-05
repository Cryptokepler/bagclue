// src/components/admin/ProductsTable.tsx
// Tabla de productos para admin (desktop)

import { StatusBadge, PublishedBadge, CategoryBadge, AuthenticityIcon } from './ProductBadges'
import { ProductAlerts } from './ProductAlerts'
import { calculateProductMetrics, formatCurrency, formatMargin } from '@/lib/product-metrics'

interface ProductsTableProps {
  products: any[]
}

export default function ProductsTable({ products }: ProductsTableProps) {
  if (products.length === 0) {
    return (
      <div className="bg-white/5 border border-[#FF69B4]/20 p-12 text-center">
        <p className="text-gray-400 mb-2">No hay productos que coincidan con los filtros</p>
        <p className="text-gray-500 text-sm">Intenta ajustar los filtros o limpiarlos para ver más productos</p>
      </div>
    )
  }
  
  return (
    <div className="bg-white/5 border border-[#FF69B4]/20 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-white/5 sticky top-0">
          <tr className="text-left text-xs text-gray-400 uppercase tracking-wider">
            <th className="px-3 py-3 w-20">Imagen</th>
            <th className="px-3 py-3 min-w-[180px]">Producto</th>
            <th className="px-3 py-3 min-w-[120px]">Marca/Modelo</th>
            <th className="px-3 py-3 w-28">Categoría</th>
            <th className="px-3 py-3 w-28 text-right">Precio</th>
            <th className="px-3 py-3 w-28 text-right">Costo</th>
            <th className="px-3 py-3 w-28 text-right">Costos Adic.</th>
            <th className="px-3 py-3 w-28 text-right">Utilidad</th>
            <th className="px-3 py-3 w-24 text-right">Margen %</th>
            <th className="px-3 py-3 w-28">Status</th>
            <th className="px-3 py-3 w-28">Publicado</th>
            <th className="px-3 py-3 w-20 text-center">Stock</th>
            <th className="px-3 py-3 min-w-[100px]">Ubicación</th>
            <th className="px-3 py-3 min-w-[100px]">Proveedor</th>
            <th className="px-3 py-3 w-20 text-center">Auth</th>
            <th className="px-3 py-3 w-24">Alertas</th>
            <th className="px-3 py-3 w-32">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#FF69B4]/10">
          {products.map((product: any) => {
            const metrics = calculateProductMetrics(product)
            const hasImage = product.product_images && product.product_images.length > 0
            
            return (
              <tr key={product.id} className="hover:bg-white/5 transition-colors">
                {/* Imagen */}
                <td className="px-3 py-3">
                  {hasImage ? (
                    <img
                      src={product.product_images[0].url}
                      alt={product.title}
                      className="w-12 h-12 object-cover border border-[#FF69B4]/20"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-white/5 border border-[#FF69B4]/20 flex items-center justify-center">
                      <span className="text-xs text-gray-500">Sin img</span>
                    </div>
                  )}
                </td>
                
                {/* Producto */}
                <td className="px-3 py-3">
                  <div className="text-white font-medium truncate max-w-[180px]" title={product.title}>
                    {product.title}
                  </div>
                  <div className="text-gray-500 text-xs truncate max-w-[180px]" title={product.slug}>
                    {product.slug}
                  </div>
                </td>
                
                {/* Marca/Modelo */}
                <td className="px-3 py-3">
                  <div className="text-gray-300 truncate max-w-[120px]" title={product.brand}>
                    {product.brand || '-'}
                  </div>
                  {product.model && (
                    <div className="text-gray-500 text-xs truncate max-w-[120px]" title={product.model}>
                      {product.model}
                    </div>
                  )}
                </td>
                
                {/* Categoría */}
                <td className="px-3 py-3">
                  <CategoryBadge category={product.category} />
                </td>
                
                {/* Precio */}
                <td className="px-3 py-3 text-right text-gray-300">
                  {product.price ? formatCurrency(product.price, product.currency) : 'Consultar'}
                </td>
                
                {/* Costo */}
                <td className="px-3 py-3 text-right text-gray-300">
                  {metrics.costPrice > 0 ? formatCurrency(metrics.costPrice, product.currency) : '-'}
                </td>
                
                {/* Costos Adicionales */}
                <td className="px-3 py-3 text-right text-gray-400">
                  {metrics.additionalCostsTotal > 0 ? formatCurrency(metrics.additionalCostsTotal, product.currency) : '-'}
                </td>
                
                {/* Utilidad */}
                <td className="px-3 py-3 text-right">
                  {metrics.profit > 0 ? (
                    <span className="text-emerald-400 font-medium">
                      {formatCurrency(metrics.profit, product.currency)}
                    </span>
                  ) : metrics.profit < 0 ? (
                    <span className="text-red-400 font-medium">
                      {formatCurrency(metrics.profit, product.currency)}
                    </span>
                  ) : (
                    <span className="text-gray-500">-</span>
                  )}
                </td>
                
                {/* Margen % */}
                <td className="px-3 py-3 text-right">
                  <span className={`font-medium ${
                    metrics.marginColor === 'green' ? 'text-emerald-400' :
                    metrics.marginColor === 'yellow' ? 'text-yellow-400' :
                    metrics.marginColor === 'red' ? 'text-red-400' :
                    'text-gray-400'
                  }`}>
                    {metrics.margin > 0 ? formatMargin(metrics.margin) : 'N/A'}
                  </span>
                </td>
                
                {/* Status */}
                <td className="px-3 py-3">
                  <StatusBadge status={product.status} />
                </td>
                
                {/* Publicado */}
                <td className="px-3 py-3">
                  <PublishedBadge isPublished={product.is_published} />
                </td>
                
                {/* Stock */}
                <td className="px-3 py-3 text-center text-gray-300">
                  {product.stock !== null && product.stock !== undefined ? product.stock : '-'}
                </td>
                
                {/* Ubicación */}
                <td className="px-3 py-3">
                  <div className="text-gray-400 text-xs truncate max-w-[100px]" title={product.physical_location || '-'}>
                    {product.physical_location || '-'}
                  </div>
                </td>
                
                {/* Proveedor */}
                <td className="px-3 py-3">
                  <div className="text-gray-400 text-xs truncate max-w-[100px]" title={product.supplier_name || '-'}>
                    {product.supplier_name || '-'}
                  </div>
                </td>
                
                {/* Autenticidad */}
                <td className="px-3 py-3 text-center">
                  <AuthenticityIcon verified={product.authenticity_verified} />
                </td>
                
                {/* Alertas */}
                <td className="px-3 py-3">
                  <ProductAlerts product={product} />
                </td>
                
                {/* Acciones */}
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <a
                      href={`/admin/productos/${product.id}`}
                      className="text-xs text-[#FF69B4] hover:underline"
                    >
                      ✏️ Editar
                    </a>
                    {product.is_published && product.slug && (
                      <a
                        href={`/catalogo/${product.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-gray-400 hover:text-[#FF69B4]"
                      >
                        👁️ Ver
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

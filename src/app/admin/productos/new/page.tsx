'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminNav from '@/components/admin/AdminNav'

const brands = ['Chanel', 'Hermès', 'Goyard', 'Céline', 'Louis Vuitton', 'Balenciaga']
const statuses = ['available', 'preorder', 'reserved', 'sold', 'hidden']
const conditions = ['new', 'excellent', 'very_good', 'good', 'used']
const categories = ['Bolsas', 'Accesorios', 'Colección París']

export default function NewProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    // slug removido - se genera automáticamente en backend
    title: '',
    brand: 'Chanel',
    model: '',
    color: '',
    origin: '',
    material: '',
    status: 'available',
    condition: 'excellent',
    category: 'Bolsas',
    condition_notes: '',
    price: '',
    currency: 'MXN',
    badge: '',
    description: '',
    is_published: false,
    // Autenticidad y accesorios
    authenticity_verified: false,
    certificate_notes: '',
    serial_number: '',
    included_accessories: '',
    includes_box: false,
    includes_dust_bag: false,
    includes_papers: false,
    // Información interna
    cost_price: '',
    additional_costs_shipping: '',
    additional_costs_authentication: '',
    additional_costs_cleaning: '',
    additional_costs_other: '',
    supplier_name: '',
    acquisition_date: '',
    physical_location: '',
    internal_notes: ''
  })

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Construir additional_costs JSONB
      const additional_costs = {
        shipping: formData.additional_costs_shipping ? parseFloat(formData.additional_costs_shipping) : null,
        authentication: formData.additional_costs_authentication ? parseFloat(formData.additional_costs_authentication) : null,
        cleaning: formData.additional_costs_cleaning ? parseFloat(formData.additional_costs_cleaning) : null,
        other: formData.additional_costs_other ? parseFloat(formData.additional_costs_other) : null
      }

      // Construir payload
      const payload = {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : null,
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
        additional_costs,
        acquisition_date: formData.acquisition_date || null,
        // Remover campos temporales de additional_costs
        additional_costs_shipping: undefined,
        additional_costs_authentication: undefined,
        additional_costs_cleaning: undefined,
        additional_costs_other: undefined
      }

      const res = await fetch('/api/products/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al crear producto')
        setLoading(false)
        return
      }

      // Redirigir a editar para subir imágenes
      router.push(`/admin/productos/${data.product.id}`)
    } catch (err) {
      setError('Error de conexión')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <AdminNav />

      {/* Form */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Información básica */}
          <div className="bg-white/5 border border-[#FF69B4]/20 p-6">
            <h2 className="text-lg text-white font-medium mb-4">Información Básica</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Título *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full bg-white/5 border border-[#FF69B4]/20 text-white px-4 py-2 focus:border-[#FF69B4] outline-none"
                  placeholder="Chanel Classic Flap Negro"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Marca *</label>
                <select
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  required
                  className="w-full bg-white/5 border border-[#FF69B4]/20 text-white px-4 py-2 focus:border-[#FF69B4] outline-none"
                >
                  {brands.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Modelo</label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-[#FF69B4]/20 text-white px-4 py-2 focus:border-[#FF69B4] outline-none"
                  placeholder="Classic Flap 25"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Color</label>
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-[#FF69B4]/20 text-white px-4 py-2 focus:border-[#FF69B4] outline-none"
                  placeholder="Negro"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Origen</label>
                <input
                  type="text"
                  name="origin"
                  value={formData.origin}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-[#FF69B4]/20 text-white px-4 py-2 focus:border-[#FF69B4] outline-none"
                  placeholder="USA, Francia, etc."
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Material</label>
                <input
                  type="text"
                  name="material"
                  value={formData.material}
                  onChange={handleChange}
                  maxLength={2000}
                  className="w-full bg-white/5 border border-[#FF69B4]/20 text-white px-4 py-2 focus:border-[#FF69B4] outline-none"
                  placeholder="Piel caviar, lona, oro 18k, piel de becerro..."
                />
              </div>
            </div>
            
            {/* Helper slug automático - movido al final */}
            <p className="mt-4 text-xs text-gray-400 italic">
              ℹ️ El enlace público del producto se generará automáticamente al guardar.
            </p>
          </div>

          {/* Status y condición */}
          <div className="bg-white/5 border border-[#FF69B4]/20 p-6">
            <h2 className="text-lg text-white font-medium mb-4">Estado y Condición</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Status *</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className="w-full bg-white/5 border border-[#FF69B4]/20 text-white px-4 py-2 focus:border-[#FF69B4] outline-none"
                >
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Condición *</label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  required
                  className="w-full bg-white/5 border border-[#FF69B4]/20 text-white px-4 py-2 focus:border-[#FF69B4] outline-none"
                >
                  {conditions.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Categoría *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full bg-white/5 border border-[#FF69B4]/20 text-white px-4 py-2 focus:border-[#FF69B4] outline-none"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm text-gray-300 mb-2">Notas de condición (recomendado)</label>
              <textarea
                name="condition_notes"
                value={formData.condition_notes}
                onChange={handleChange}
                maxLength={2000}
                rows={3}
                className="w-full bg-white/5 border border-[#FF69B4]/20 text-white px-4 py-2 focus:border-[#FF69B4] outline-none"
                placeholder="Ligero desgaste en esquinas, interior limpio, herrajes con micro rayas..."
              />
              <p className="text-xs text-gray-500 mt-1">{formData.condition_notes.length}/2000 caracteres</p>
            </div>
          </div>

          {/* Precio y Publicación */}
          <div className="bg-white/5 border border-[#FF69B4]/20 p-6">
            <h2 className="text-lg text-white font-medium mb-4">Precio y Publicación</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Precio * <span className="text-xs text-gray-500">(requerido)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  className="w-full bg-white/5 border border-[#FF69B4]/20 text-white px-4 py-2 focus:border-[#FF69B4] outline-none"
                  placeholder="189000"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Moneda</label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-[#FF69B4]/20 text-white px-4 py-2 focus:border-[#FF69B4] outline-none"
                >
                  <option value="MXN">MXN</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Badge (opcional)</label>
                <input
                  type="text"
                  name="badge"
                  value={formData.badge}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-[#FF69B4]/20 text-white px-4 py-2 focus:border-[#FF69B4] outline-none"
                  placeholder="Pieza única, Edición limitada, etc."
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Descripción</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  maxLength={2000}
                  rows={4}
                  className="w-full bg-white/5 border border-[#FF69B4]/20 text-white px-4 py-2 focus:border-[#FF69B4] outline-none"
                  placeholder="Descripción detallada del producto..."
                />
                <p className="text-xs text-gray-500 mt-1">{formData.description.length}/2000 caracteres</p>
              </div>
              <label className="flex items-center gap-3 text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_published"
                  checked={formData.is_published}
                  onChange={handleChange}
                  className="w-4 h-4"
                />
                Publicar inmediatamente en el catálogo
              </label>
            </div>
          </div>

          {/* Autenticidad y Accesorios */}
          <div className="bg-white/5 border border-[#FF69B4]/20 p-6">
            <h2 className="text-lg text-white font-medium mb-4">Autenticidad y Accesorios</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-3 text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  name="authenticity_verified"
                  checked={formData.authenticity_verified}
                  onChange={handleChange}
                  className="w-4 h-4"
                />
                Autenticidad verificada
              </label>
              
              <div>
                <label className="block text-sm text-gray-300 mb-2">Notas de certificado (solo admin)</label>
                <textarea
                  name="certificate_notes"
                  value={formData.certificate_notes}
                  onChange={handleChange}
                  maxLength={2000}
                  rows={2}
                  className="w-full bg-white/5 border border-[#FF69B4]/20 text-white px-4 py-2 focus:border-[#FF69B4] outline-none"
                  placeholder="Detalles del certificado Entrupy, número de verificación..."
                />
                <p className="text-xs text-gray-500 mt-1">{formData.certificate_notes.length}/2000 caracteres</p>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Número de serie (solo admin)</label>
                <input
                  type="text"
                  name="serial_number"
                  value={formData.serial_number}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-[#FF69B4]/20 text-white px-4 py-2 focus:border-[#FF69B4] outline-none"
                  placeholder="123456789"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Accesorios incluidos</label>
                <textarea
                  name="included_accessories"
                  value={formData.included_accessories}
                  onChange={handleChange}
                  maxLength={2000}
                  rows={3}
                  className="w-full bg-white/5 border border-[#FF69B4]/20 text-white px-4 py-2 focus:border-[#FF69B4] outline-none"
                  placeholder="Caja, dust bag, certificado Entrupy, correa, candado, llaves..."
                />
                <p className="text-xs text-gray-500 mt-1">{formData.included_accessories.length}/2000 caracteres</p>
              </div>

              <div className="border-t border-[#FF69B4]/20 pt-4">
                <p className="text-sm text-gray-400 mb-3">Extras originales:</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      name="includes_box"
                      checked={formData.includes_box}
                      onChange={handleChange}
                      className="w-4 h-4"
                    />
                    Incluye caja original
                  </label>
                  <label className="flex items-center gap-3 text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      name="includes_dust_bag"
                      checked={formData.includes_dust_bag}
                      onChange={handleChange}
                      className="w-4 h-4"
                    />
                    Incluye dust bag
                  </label>
                  <label className="flex items-center gap-3 text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      name="includes_papers"
                      checked={formData.includes_papers}
                      onChange={handleChange}
                      className="w-4 h-4"
                    />
                    Incluye papeles/certificados originales
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Información Interna */}
          <div className="bg-white/5 border border-[#FF69B4]/20 p-6">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg text-white font-medium">Información Interna</h2>
              <span className="text-xs text-gray-400 italic">🔒 Privado (no se muestra en tienda)</span>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Costo de compra</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="cost_price"
                    value={formData.cost_price}
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-[#FF69B4]/20 text-white px-4 py-2 focus:border-[#FF69B4] outline-none"
                    placeholder="120000"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Proveedor / fuente</label>
                  <input
                    type="text"
                    name="supplier_name"
                    value={formData.supplier_name}
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-[#FF69B4]/20 text-white px-4 py-2 focus:border-[#FF69B4] outline-none"
                    placeholder="Nombre del proveedor"
                  />
                </div>
              </div>

              <div className="border border-[#FF69B4]/10 p-4 bg-white/[0.02]">
                <p className="text-sm text-gray-400 mb-3">Costos adicionales:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Costo envío/importación</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="additional_costs_shipping"
                      value={formData.additional_costs_shipping}
                      onChange={handleChange}
                      className="w-full bg-white/5 border border-[#FF69B4]/20 text-white px-3 py-2 text-sm focus:border-[#FF69B4] outline-none"
                      placeholder="500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Costo autenticación</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="additional_costs_authentication"
                      value={formData.additional_costs_authentication}
                      onChange={handleChange}
                      className="w-full bg-white/5 border border-[#FF69B4]/20 text-white px-3 py-2 text-sm focus:border-[#FF69B4] outline-none"
                      placeholder="200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Costo limpieza/reparación</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="additional_costs_cleaning"
                      value={formData.additional_costs_cleaning}
                      onChange={handleChange}
                      className="w-full bg-white/5 border border-[#FF69B4]/20 text-white px-3 py-2 text-sm focus:border-[#FF69B4] outline-none"
                      placeholder="100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Otros costos</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="additional_costs_other"
                      value={formData.additional_costs_other}
                      onChange={handleChange}
                      className="w-full bg-white/5 border border-[#FF69B4]/20 text-white px-3 py-2 text-sm focus:border-[#FF69B4] outline-none"
                      placeholder="50"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Fecha de adquisición</label>
                  <input
                    type="date"
                    name="acquisition_date"
                    value={formData.acquisition_date}
                    onChange={handleChange}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full bg-white/5 border border-[#FF69B4]/20 text-white px-4 py-2 focus:border-[#FF69B4] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Ubicación física</label>
                  <input
                    type="text"
                    name="physical_location"
                    value={formData.physical_location}
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-[#FF69B4]/20 text-white px-4 py-2 focus:border-[#FF69B4] outline-none"
                    placeholder="Showroom, bodega, vitrina 1, estante A3..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Notas internas</label>
                <textarea
                  name="internal_notes"
                  value={formData.internal_notes}
                  onChange={handleChange}
                  maxLength={2000}
                  rows={3}
                  className="w-full bg-white/5 border border-[#FF69B4]/20 text-white px-4 py-2 focus:border-[#FF69B4] outline-none"
                  placeholder="Notas privadas, observaciones, historial..."
                />
                <p className="text-xs text-gray-500 mt-1">{formData.internal_notes.length}/2000 caracteres</p>
              </div>

              {/* Cálculo de rentabilidad */}
              {formData.cost_price && parseFloat(formData.cost_price) > 0 && formData.price && parseFloat(formData.price) > 0 && (
                <div className="border border-gray-600 rounded p-4 bg-gray-900/50 mt-4">
                  <h3 className="text-sm font-medium text-white mb-3">📊 Rentabilidad Estimada</h3>
                  {(() => {
                    const costPrice = parseFloat(formData.cost_price) || 0
                    const shipping = parseFloat(formData.additional_costs_shipping) || 0
                    const authentication = parseFloat(formData.additional_costs_authentication) || 0
                    const cleaning = parseFloat(formData.additional_costs_cleaning) || 0
                    const other = parseFloat(formData.additional_costs_other) || 0
                    const totalAdditionalCosts = shipping + authentication + cleaning + other
                    const totalCost = costPrice + totalAdditionalCosts
                    const salePrice = parseFloat(formData.price) || 0
                    const profit = salePrice - totalCost
                    const margin = salePrice > 0 ? (profit / salePrice) * 100 : 0

                    const getMarginColor = (m: number) => {
                      if (m > 30) return 'text-green-400'
                      if (m >= 15) return 'text-yellow-400'
                      return 'text-red-400'
                    }

                    const formatNumber = (n: number) => n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

                    return (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Costo de compra:</span>
                          <span className="font-medium text-white">${formatNumber(costPrice)} MXN</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Costos adicionales:</span>
                          <span className="font-medium text-white">${formatNumber(totalAdditionalCosts)} MXN</span>
                        </div>
                        <div className="border-t border-gray-700 pt-2 flex justify-between">
                          <span className="text-gray-300 font-medium">Costo total:</span>
                          <span className="font-medium text-white">${formatNumber(totalCost)} MXN</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300 font-medium">Precio de venta:</span>
                          <span className="font-medium text-white">${formatNumber(salePrice)} MXN</span>
                        </div>
                        <div className="border-t border-gray-700 pt-2 flex justify-between">
                          <span className="text-white font-semibold">Utilidad estimada:</span>
                          <span className={`font-semibold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            ${formatNumber(profit)} MXN
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white font-semibold">Margen:</span>
                          <span className={`font-semibold ${getMarginColor(margin)}`}>
                            {formatNumber(margin)}%
                          </span>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-[#FF69B4] text-[#0a0a0a] font-medium px-8 py-3 hover:bg-[#FF69B4]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creando...' : 'Crear Producto'}
            </button>
            <Link
              href="/admin"
              className="border border-[#FF69B4]/20 text-gray-300 px-8 py-3 hover:border-[#FF69B4] transition-colors"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </main>
    </div>
  )
}

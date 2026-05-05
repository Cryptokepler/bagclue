'use client'

import { useState, FormEvent, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminNav from './AdminNav'

const brands = ['Chanel', 'Hermès', 'Goyard', 'Céline', 'Louis Vuitton', 'Balenciaga']
const statuses = ['available', 'preorder', 'reserved', 'sold', 'hidden']
const conditions = ['new', 'excellent', 'very_good', 'good', 'used']
const categories = ['Bolsas', 'Accesorios', 'Colección París']

interface EditProductFormProps {
  product: any
}

export default function EditProductForm({ product }: EditProductFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    slug: product.slug || '',
    title: product.title || '',
    brand: product.brand || 'Chanel',
    model: product.model || '',
    color: product.color || '',
    origin: product.origin || '',
    material: product.material || '',
    status: product.status || 'available',
    condition: product.condition || 'excellent',
    category: product.category || 'Bolsas',
    condition_notes: product.condition_notes || '',
    price: product.price || '',
    currency: product.currency || 'MXN',
    badge: product.badge || '',
    description: product.description || '',
    is_published: product.is_published || false,
    // Autenticidad y accesorios
    authenticity_verified: product.authenticity_verified || false,
    certificate_notes: product.certificate_notes || '',
    serial_number: product.serial_number || '',
    included_accessories: product.included_accessories || '',
    includes_box: product.includes_box || false,
    includes_dust_bag: product.includes_dust_bag || false,
    includes_papers: product.includes_papers || false,
    // Información interna
    cost_price: product.cost_price || '',
    additional_costs_shipping: product.additional_costs?.shipping || '',
    additional_costs_authentication: product.additional_costs?.authentication || '',
    additional_costs_cleaning: product.additional_costs?.cleaning || '',
    additional_costs_other: product.additional_costs?.other || '',
    supplier_name: product.supplier_name || '',
    acquisition_date: product.acquisition_date || '',
    physical_location: product.physical_location || '',
    internal_notes: product.internal_notes || ''
  })

  const [images, setImages] = useState(product.product_images || [])

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

      // Construir payload (NO incluir slug - no se puede editar)
      const payload = {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : null,
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
        additional_costs,
        acquisition_date: formData.acquisition_date || null,
        slug: undefined, // Remover slug del payload
        // Remover campos temporales de additional_costs
        additional_costs_shipping: undefined,
        additional_costs_authentication: undefined,
        additional_costs_cleaning: undefined,
        additional_costs_other: undefined
      }

      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al actualizar producto')
        setLoading(false)
        return
      }

      // Refresh
      router.refresh()
      alert('Producto actualizado exitosamente')
      setLoading(false)
    } catch (err) {
      setError('Error de conexión')
      setLoading(false)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    
    // Validar tipo
    if (!file.type.startsWith('image/')) {
      setError('El archivo debe ser una imagen')
      return
    }

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen debe ser menor a 5MB')
      return
    }

    setError('')
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`/api/products/${product.id}/upload-image`, {
        method: 'POST',
        body: formData
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al subir imagen')
        setUploading(false)
        return
      }

      // Agregar imagen a la lista
      setImages((prev: any) => [...prev, data.image])
      setUploading(false)
      
      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      setError('Error de conexión al subir imagen')
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <AdminNav />

      {/* Main */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Imágenes */}
        <div className="bg-white/5 border border-[#FF69B4]/20 p-6 mb-8">
          <h2 className="text-lg text-white font-medium mb-4">Imágenes</h2>
          
          {/* Galería */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {images.map((img: any) => (
              <div key={img.id} className="aspect-square relative border border-[#FF69B4]/20">
                <img
                  src={img.url}
                  alt={img.alt || ''}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>

          {/* Upload */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className={`inline-block border border-[#FF69B4]/20 text-gray-300 px-6 py-2 hover:border-[#FF69B4] transition-colors cursor-pointer ${
                uploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {uploading ? 'Subiendo...' : '+ Agregar imagen'}
            </label>
            <p className="text-xs text-gray-500 mt-2">
              Formatos: JPG, PNG, WEBP. Máximo 5MB por imagen.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Información básica */}
          <div className="bg-white/5 border border-[#FF69B4]/20 p-6">
            <h2 className="text-lg text-white font-medium mb-4">Información Básica</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">URL del producto</label>
                <input
                  type="text"
                  value={`/catalogo/${formData.slug}`}
                  disabled
                  className="w-full bg-white/10 border border-[#FF69B4]/10 text-gray-400 px-4 py-2 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  El enlace del producto no se puede modificar para mantener URLs estables.
                </p>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Título *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full bg-white/5 border border-[#FF69B4]/20 text-white px-4 py-2 focus:border-[#FF69B4] outline-none"
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

          {/* Precio */}
          <div className="bg-white/5 border border-[#FF69B4]/20 p-6">
            <h2 className="text-lg text-white font-medium mb-4">Precio</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Precio</label>
                <input
                  type="number"
                  step="0.01"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-[#FF69B4]/20 text-white px-4 py-2 focus:border-[#FF69B4] outline-none"
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
          </div>

          {/* Descripción */}
          <div className="bg-white/5 border border-[#FF69B4]/20 p-6">
            <h2 className="text-lg text-white font-medium mb-4">Descripción</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Badge</label>
                <input
                  type="text"
                  name="badge"
                  value={formData.badge}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-[#FF69B4]/20 text-white px-4 py-2 focus:border-[#FF69B4] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Descripción</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full bg-white/5 border border-[#FF69B4]/20 text-white px-4 py-2 focus:border-[#FF69B4] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Extras */}
          <div className="bg-white/5 border border-[#FF69B4]/20 p-6">
            <h2 className="text-lg text-white font-medium mb-4">Extras Incluidos</h2>
            <div className="space-y-3">
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
                Incluye papeles/certificados
              </label>
            </div>
          </div>

          {/* Publicación */}
          <div className="bg-white/5 border border-[#FF69B4]/20 p-6">
            <h2 className="text-lg text-white font-medium mb-4">Publicación</h2>
            <label className="flex items-center gap-3 text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                name="is_published"
                checked={formData.is_published}
                onChange={handleChange}
                className="w-4 h-4"
              />
              Publicado en el catálogo
            </label>
            <p className="text-xs text-gray-500 mt-2">
              {formData.is_published 
                ? 'Este producto es visible en el catálogo público' 
                : 'Este producto está oculto del catálogo público'}
            </p>
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
              {loading ? 'Guardando...' : 'Guardar Cambios'}
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

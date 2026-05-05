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
    status: 'available',
    condition: 'excellent',
    price: '',
    currency: 'MXN',
    category: 'Bolsas',
    badge: '',
    description: '',
    is_published: false,
    includes_box: false,
    includes_dust_bag: false,
    includes_papers: false
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
      const res = await fetch('/api/products/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
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
            
            {/* Helper slug automático */}
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 text-sm text-blue-300">
              ℹ️ El enlace del producto (URL) se genera automáticamente basado en marca, modelo, título y color.
            </div>
            
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
          </div>

          {/* Precio */}
          <div className="bg-white/5 border border-[#FF69B4]/20 p-6">
            <h2 className="text-lg text-white font-medium mb-4">Precio</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Precio <span className="text-xs text-gray-500">(dejar vacío = "Consultar")</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
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
          </div>

          {/* Descripción */}
          <div className="bg-white/5 border border-[#FF69B4]/20 p-6">
            <h2 className="text-lg text-white font-medium mb-4">Descripción</h2>
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
                  rows={4}
                  className="w-full bg-white/5 border border-[#FF69B4]/20 text-white px-4 py-2 focus:border-[#FF69B4] outline-none"
                  placeholder="Descripción detallada del producto..."
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
              Publicar inmediatamente en el catálogo
            </label>
            <p className="text-xs text-gray-500 mt-2">
              Si no publicas ahora, podrás hacerlo después desde el panel de admin
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

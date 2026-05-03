'use client'

import { useState } from 'react'
import type { Address, CreateAddressDTO, UpdateAddressDTO } from '@/types/address'

interface AddressFormProps {
  mode: 'create' | 'edit'
  initialData?: Address
  onSuccess: () => void
  onCancel: () => void
  authToken: string
}

// Países con código telefónico
const COUNTRIES = [
  { name: 'México', code: '+52', iso: 'MX' },
  { name: 'España', code: '+34', iso: 'ES' },
  { name: 'Estados Unidos', code: '+1', iso: 'US' },
  { name: 'Venezuela', code: '+58', iso: 'VE' },
  { name: 'Colombia', code: '+57', iso: 'CO' },
  { name: 'Otro', code: '', iso: '' }
]

export default function AddressForm({
  mode,
  initialData,
  onSuccess,
  onCancel,
  authToken
}: AddressFormProps) {
  const [formData, setFormData] = useState({
    full_name: initialData?.full_name || '',
    phone_country_code: initialData?.phone_country_code || '',
    phone_country_iso: initialData?.phone_country_iso || '',
    phone: initialData?.phone || '',
    country: initialData?.country || '',
    state: initialData?.state || '',
    city: initialData?.city || '',
    postal_code: initialData?.postal_code || '',
    address_line1: initialData?.address_line1 || '',
    address_line2: initialData?.address_line2 || '',
    delivery_references: initialData?.delivery_references || '',
    is_default: initialData?.is_default || false
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState(() => {
    if (initialData?.country) {
      const found = COUNTRIES.find(c => c.name === initialData.country)
      return found ? found.name : 'Otro'
    }
    return 'México'
  })

  const handleCountryChange = (countryName: string) => {
    setSelectedCountry(countryName)
    const country = COUNTRIES.find(c => c.name === countryName)
    
    if (country) {
      setFormData(prev => ({
        ...prev,
        country: country.name === 'Otro' ? prev.country : country.name,
        phone_country_code: country.code,
        phone_country_iso: country.iso
      }))
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Campos requeridos
    if (!formData.full_name.trim()) newErrors.full_name = 'Nombre completo es requerido'
    if (!formData.country.trim()) newErrors.country = 'País es requerido'
    if (!formData.city.trim()) newErrors.city = 'Ciudad es requerida'
    if (!formData.address_line1.trim()) newErrors.address_line1 = 'Dirección es requerida'

    // Validar long name
    if (formData.full_name.length > 100) newErrors.full_name = 'Nombre muy largo (máx 100 caracteres)'
    if (formData.full_name.length > 0 && formData.full_name.length < 2) newErrors.full_name = 'Nombre debe tener al menos 2 caracteres'

    // Validar phone_country_code si se proporciona
    if (formData.phone_country_code && !/^\+\d{1,4}$/.test(formData.phone_country_code)) {
      newErrors.phone_country_code = 'Formato inválido. Ej: +52'
    }

    // Validar phone_country_iso si se proporciona
    if (formData.phone_country_iso && !/^[A-Z]{2}$/.test(formData.phone_country_iso)) {
      newErrors.phone_country_iso = 'Código ISO inválido. Ej: MX'
    }

    // Validar phone si se proporciona
    if (formData.phone && (formData.phone.length < 8 || formData.phone.length > 15)) {
      newErrors.phone = 'Teléfono debe tener entre 8 y 15 dígitos'
    }

    // Validar delivery_references length
    if (formData.delivery_references && formData.delivery_references.length > 500) {
      newErrors.delivery_references = 'Referencias muy largas (máx 500 caracteres)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) return

    setLoading(true)

    try {
      const url = mode === 'create'
        ? '/api/account/addresses'
        : `/api/account/addresses/${initialData?.id}`
      
      const method = mode === 'create' ? 'POST' : 'PATCH'

      // Preparar payload (solo enviar campos no vacíos)
      const payload: any = {}
      
      if (formData.full_name) payload.full_name = formData.full_name.trim()
      if (formData.phone_country_code) payload.phone_country_code = formData.phone_country_code
      if (formData.phone_country_iso) payload.phone_country_iso = formData.phone_country_iso
      if (formData.phone) payload.phone = formData.phone.trim()
      if (formData.country) payload.country = formData.country.trim()
      if (formData.state) payload.state = formData.state.trim()
      if (formData.city) payload.city = formData.city.trim()
      if (formData.postal_code) payload.postal_code = formData.postal_code.trim()
      if (formData.address_line1) payload.address_line1 = formData.address_line1.trim()
      if (formData.address_line2) payload.address_line2 = formData.address_line2.trim()
      if (formData.delivery_references) payload.delivery_references = formData.delivery_references.trim()
      
      // Siempre enviar is_default
      payload.is_default = formData.is_default

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 400 && data.errors) {
          // Mapear errores de backend a campos
          const backendErrors: Record<string, string> = {}
          data.errors.forEach((err: string) => {
            if (err.includes('full_name')) backendErrors.full_name = err
            else if (err.includes('phone_country_code')) backendErrors.phone_country_code = err
            else if (err.includes('phone_country_iso')) backendErrors.phone_country_iso = err
            else if (err.includes('country')) backendErrors.country = err
            else if (err.includes('city')) backendErrors.city = err
            else if (err.includes('address_line1')) backendErrors.address_line1 = err
            else backendErrors.general = err
          })
          setErrors(backendErrors)
          return
        }
        
        if (response.status === 401) {
          alert('Sesión expirada. Por favor inicia sesión de nuevo.')
          window.location.href = '/account/login'
          return
        }

        throw new Error(data.error || 'Error al guardar dirección')
      }

      alert(mode === 'create' ? 'Dirección agregada correctamente' : 'Dirección actualizada correctamente')
      onSuccess()

    } catch (error) {
      console.error('Error saving address:', error)
      alert(error instanceof Error ? error.message : 'Error al guardar dirección. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50"
        onClick={onCancel}
      />
      
      {/* Form Container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {mode === 'create' ? 'Agregar dirección' : 'Editar dirección'}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Error general */}
            {errors.general && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {errors.general}
              </div>
            )}

            {/* Nombre completo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                  errors.full_name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Ej: María García"
              />
              {errors.full_name && (
                <p className="text-sm text-red-600 mt-1">{errors.full_name}</p>
              )}
            </div>

            {/* País (selector) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                País <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedCountry}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} {c.code && `(${c.code})`}
                  </option>
                ))}
              </select>
              
              {/* Si eligió "Otro", mostrar campo manual */}
              {selectedCountry === 'Otro' && (
                <div className="mt-2">
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                      errors.country ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Escribe el nombre del país"
                  />
                </div>
              )}
              
              {errors.country && (
                <p className="text-sm text-red-600 mt-1">{errors.country}</p>
              )}
            </div>

            {/* Estado/Provincia */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado / Provincia
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Ej: Ciudad de México"
              />
            </div>

            {/* Ciudad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ciudad <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                  errors.city ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Ej: Monterrey"
              />
              {errors.city && (
                <p className="text-sm text-red-600 mt-1">{errors.city}</p>
              )}
            </div>

            {/* Código postal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código postal
              </label>
              <input
                type="text"
                value={formData.postal_code}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Ej: 64000"
              />
            </div>

            {/* Calle y número */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Calle y número <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.address_line1}
                onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                  errors.address_line1 ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Ej: Av. Reforma 123"
              />
              {errors.address_line1 && (
                <p className="text-sm text-red-600 mt-1">{errors.address_line1}</p>
              )}
            </div>

            {/* Depto, piso, etc */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Depto, piso, interior (opcional)
              </label>
              <input
                type="text"
                value={formData.address_line2}
                onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Ej: Depto 4B"
              />
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono (opcional)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={formData.phone_country_code}
                  onChange={(e) => setFormData({ ...formData, phone_country_code: e.target.value })}
                  className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                    errors.phone_country_code ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="+52"
                  disabled={selectedCountry !== 'Otro'}
                />
                <input
                  type="text"
                  value={formData.phone_country_iso}
                  onChange={(e) => setFormData({ ...formData, phone_country_iso: e.target.value.toUpperCase() })}
                  className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                    errors.phone_country_iso ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="MX"
                  maxLength={2}
                  disabled={selectedCountry !== 'Otro'}
                />
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                  className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                    errors.phone ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="5512345678"
                />
              </div>
              {(errors.phone_country_code || errors.phone_country_iso || errors.phone) && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.phone_country_code || errors.phone_country_iso || errors.phone}
                </p>
              )}
            </div>

            {/* Referencias de entrega */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Referencias de entrega (opcional)
              </label>
              <textarea
                value={formData.delivery_references}
                onChange={(e) => setFormData({ ...formData, delivery_references: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none ${
                  errors.delivery_references ? 'border-red-300' : 'border-gray-300'
                }`}
                rows={3}
                placeholder="Ej: Torre A, piso 3, portón negro"
              />
              {errors.delivery_references && (
                <p className="text-sm text-red-600 mt-1">{errors.delivery_references}</p>
              )}
            </div>

            {/* Marcar como principal */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_default"
                checked={formData.is_default}
                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                className="w-4 h-4 text-pink-500 border-gray-300 rounded focus:ring-pink-500"
              />
              <label htmlFor="is_default" className="ml-2 text-sm text-gray-700">
                Marcar como dirección principal
              </label>
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-pink-500 rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ProfileFormProps {
  initialData: {
    email: string
    name: string | null
    phone: string | null
    phone_country_code: string | null
    phone_country_iso: string | null
    created_at: string
  }
  onUpdate: () => void
  authToken: string
}

const COUNTRIES = [
  { name: 'México', code: '+52', iso: 'MX' },
  { name: 'España', code: '+34', iso: 'ES' },
  { name: 'Estados Unidos', code: '+1', iso: 'US' },
  { name: 'Venezuela', code: '+58', iso: 'VE' },
  { name: 'Colombia', code: '+57', iso: 'CO' },
  { name: 'Otro', code: '', iso: '' }
]

export default function ProfileForm({ initialData, onUpdate, authToken }: ProfileFormProps) {
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    phone: initialData.phone || '',
    phone_country_code: initialData.phone_country_code || '+52',
    phone_country_iso: initialData.phone_country_iso || 'MX'
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  
  // Detectar país seleccionado
  const [selectedCountry, setSelectedCountry] = useState(() => {
    const found = COUNTRIES.find(
      c => c.code === initialData.phone_country_code && c.iso === initialData.phone_country_iso
    )
    return found ? found.name : 'México'
  })

  const handleCountryChange = (countryName: string) => {
    setSelectedCountry(countryName)
    const country = COUNTRIES.find(c => c.name === countryName)
    
    if (country && country.name !== 'Otro') {
      setFormData(prev => ({
        ...prev,
        phone_country_code: country.code,
        phone_country_iso: country.iso
      }))
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Name: opcional, pero si se envía debe tener 2-100 chars
    if (formData.name && formData.name.trim().length > 0) {
      if (formData.name.trim().length < 2) {
        newErrors.name = 'El nombre debe tener al menos 2 caracteres'
      } else if (formData.name.length > 100) {
        newErrors.name = 'El nombre debe tener máximo 100 caracteres'
      }
    }

    // Phone: opcional, pero si se envía debe tener 8-15 dígitos
    if (formData.phone && formData.phone.trim().length > 0) {
      const phoneDigits = formData.phone.replace(/\D/g, '')
      if (phoneDigits.length < 8 || phoneDigits.length > 15) {
        newErrors.phone = 'El teléfono debe tener entre 8 y 15 dígitos'
      }
      
      // Si hay phone, debe haber country_code e iso
      if (!formData.phone_country_code || !/^\+\d{1,4}$/.test(formData.phone_country_code)) {
        newErrors.phone_country_code = 'Código de país inválido. Ejemplo: +52'
      }
      if (!formData.phone_country_iso || !/^[A-Z]{2}$/.test(formData.phone_country_iso)) {
        newErrors.phone_country_iso = 'Código ISO inválido. Ejemplo: MX'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) return

    setLoading(true)

    try {
      // Preparar payload (solo enviar campos que tienen valor)
      const payload: any = {}
      
      if (formData.name && formData.name.trim()) {
        payload.name = formData.name.trim()
      }
      
      if (formData.phone && formData.phone.trim()) {
        payload.phone = formData.phone.trim()
        payload.phone_country_code = formData.phone_country_code
        payload.phone_country_iso = formData.phone_country_iso
      }

      const response = await fetch('/api/customer/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 400 && data.errors) {
          const backendErrors: Record<string, string> = {}
          data.errors.forEach((err: string) => {
            if (err.includes('name')) backendErrors.name = err
            else if (err.includes('phone_country_code')) backendErrors.phone_country_code = err
            else if (err.includes('phone_country_iso')) backendErrors.phone_country_iso = err
            else if (err.includes('phone')) backendErrors.phone = err
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

        throw new Error(data.error || 'Error al guardar perfil')
      }

      // Mostrar mensaje de éxito
      setShowSuccess(true)
      onUpdate()
      
      // Redirigir a /account después de 1 segundo
      setTimeout(() => {
        router.push('/account')
      }, 1000)

    } catch (error) {
      console.error('Error saving profile:', error)
      alert(error instanceof Error ? error.message : 'Error al guardar perfil. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // Formatear fecha de registro
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    } catch {
      return dateString
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Datos del perfil
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Mensaje de éxito */}
        {showSuccess && (
          <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700 flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Perfil actualizado correctamente</span>
          </div>
        )}
        
        {/* Error general */}
        {errors.general && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {errors.general}
          </div>
        )}

        {/* Email (read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={initialData.email}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 mt-1">
            El email no se puede modificar
          </p>
        </div>

        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${
              errors.name ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Tu nombre"
          />
          {errors.name && (
            <p className="text-sm text-red-600 mt-1">{errors.name}</p>
          )}
        </div>

        {/* Teléfono */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono
          </label>
          
          {/* Selector país */}
          <select
            value={selectedCountry}
            onChange={(e) => handleCountryChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 mb-2"
          >
            {COUNTRIES.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name} {c.code && `(${c.code})`}
              </option>
            ))}
          </select>
          
          {/* Si "Otro", mostrar inputs manuales */}
          {selectedCountry === 'Otro' && (
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input
                type="text"
                value={formData.phone_country_code}
                onChange={(e) => setFormData({ ...formData, phone_country_code: e.target.value })}
                className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                  errors.phone_country_code ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="+52"
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
              />
            </div>
          )}
          
          {/* Número de teléfono */}
          <input
            type="text"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${
              errors.phone ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="5512345678"
          />
          
          {(errors.phone || errors.phone_country_code || errors.phone_country_iso) && (
            <p className="text-sm text-red-600 mt-1">
              {errors.phone || errors.phone_country_code || errors.phone_country_iso}
            </p>
          )}
        </div>

        {/* Fecha de registro (read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Miembro desde
          </label>
          <input
            type="text"
            value={formatDate(initialData.created_at)}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
          />
        </div>

        {/* Botón guardar */}
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  )
}

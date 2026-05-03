'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AccountLayout from '@/components/customer/AccountLayout'
import AddressCard from '@/components/customer/AddressCard'
import AddressForm from '@/components/customer/AddressForm'
import AddressEmptyState from '@/components/customer/AddressEmptyState'
import ConfirmDialog from '@/components/customer/ConfirmDialog'
import { supabaseCustomer } from '@/lib/supabase-customer'
import type { Address } from '@/types/address'

export default function CustomerAddressesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [userEmail, setUserEmail] = useState<string | undefined>()
  const [authToken, setAuthToken] = useState<string>('')
  
  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  
  // Delete confirmation state
  const [deletingAddressId, setDeletingAddressId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Set default state
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null)

  useEffect(() => {
    checkAuthAndLoadAddresses()
  }, [])

  const checkAuthAndLoadAddresses = async () => {
    try {
      const { data: { user }, error: userError } = await supabaseCustomer.auth.getUser()
      
      if (userError || !user) {
        router.push('/account/login')
        return
      }
      
      setUserEmail(user.email)
      
      // Get session token
      const { data: { session } } = await supabaseCustomer.auth.getSession()
      if (session?.access_token) {
        setAuthToken(session.access_token)
      }
      
      await loadAddresses(session?.access_token || '')
      
    } catch (error) {
      console.error('Error checking auth:', error)
      router.push('/account/login')
    }
  }

  const loadAddresses = async (token?: string) => {
    setLoading(true)
    try {
      const tokenToUse = token || authToken
      
      const response = await fetch('/api/account/addresses', {
        headers: {
          'Authorization': `Bearer ${tokenToUse}`
        }
      })

      if (response.status === 401) {
        router.push('/account/login')
        return
      }

      if (!response.ok) {
        throw new Error('Error al cargar direcciones')
      }

      const data = await response.json()
      setAddresses(data.addresses || [])

    } catch (error) {
      console.error('Error loading addresses:', error)
      alert('Error al cargar direcciones')
    } finally {
      setLoading(false)
    }
  }

  const handleAddClick = () => {
    setEditingAddress(null)
    setIsFormOpen(true)
  }

  const handleEditClick = (address: Address) => {
    setEditingAddress(address)
    setIsFormOpen(true)
  }

  const handleFormSuccess = async () => {
    setIsFormOpen(false)
    setEditingAddress(null)
    await loadAddresses()
  }

  const handleFormCancel = () => {
    setIsFormOpen(false)
    setEditingAddress(null)
  }

  const handleDeleteClick = (addressId: string) => {
    setDeletingAddressId(addressId)
  }

  const handleConfirmDelete = async () => {
    if (!deletingAddressId) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/account/addresses/${deletingAddressId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      if (response.status === 401) {
        alert('Sesión expirada. Por favor inicia sesión de nuevo.')
        router.push('/account/login')
        return
      }

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al eliminar dirección')
      }

      alert('Dirección eliminada correctamente')
      setDeletingAddressId(null)
      await loadAddresses()

    } catch (error) {
      console.error('Error deleting address:', error)
      alert(error instanceof Error ? error.message : 'Error al eliminar dirección')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSetDefault = async (addressId: string) => {
    setSettingDefaultId(addressId)
    try {
      const response = await fetch(`/api/account/addresses/${addressId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ is_default: true })
      })

      if (response.status === 401) {
        alert('Sesión expirada. Por favor inicia sesión de nuevo.')
        router.push('/account/login')
        return
      }

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al marcar como principal')
      }

      alert('Dirección marcada como principal')
      await loadAddresses()

    } catch (error) {
      console.error('Error setting default:', error)
      alert(error instanceof Error ? error.message : 'Error al marcar como principal')
    } finally {
      setSettingDefaultId(null)
    }
  }

  return (
    <AccountLayout userEmail={userEmail}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-playfair tracking-wide text-gray-900 mb-2">
              Mis direcciones
            </h1>
            <p className="text-gray-600">
              Administra tus direcciones de envío
            </p>
          </div>
          
          {!loading && addresses.length > 0 && (
            <button
              onClick={handleAddClick}
              className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors font-medium"
            >
              + Agregar dirección
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && addresses.length === 0 && (
          <AddressEmptyState onAddClick={handleAddClick} />
        )}

        {/* Addresses List */}
        {!loading && addresses.length > 0 && (
          <div className="space-y-4">
            {addresses.map((address) => (
              <AddressCard
                key={address.id}
                address={address}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
                onSetDefault={handleSetDefault}
                isDeleting={isDeleting && deletingAddressId === address.id}
                isSettingDefault={settingDefaultId === address.id}
              />
            ))}
          </div>
        )}

        {/* Address Form Modal */}
        {isFormOpen && (
          <AddressForm
            mode={editingAddress ? 'edit' : 'create'}
            initialData={editingAddress || undefined}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
            authToken={authToken}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={deletingAddressId !== null}
          title="Eliminar dirección"
          message="¿Estás seguro de que deseas eliminar esta dirección? Esta acción no se puede deshacer."
          confirmText="Eliminar"
          cancelText="Cancelar"
          variant="danger"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingAddressId(null)}
          isLoading={isDeleting}
        />
      </div>
    </AccountLayout>
  )
}

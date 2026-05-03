'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabaseCustomer } from '@/lib/supabase-customer'

interface CustomerProfile {
  id: string
  user_id: string
  email: string
  name: string | null
  phone: string | null
  phone_country_code: string | null
  phone_country_iso: string | null
  created_at: string
  updated_at: string
}

interface AccountDashboardProps {
  profile: CustomerProfile
}

interface DashboardData {
  orders: {
    total: number
    lastOrder: any | null
    inTransit: number
  }
  layaways: {
    active: number
    completed: number
    totalPending: number
    nextPayment: any | null
  }
  addresses: {
    total: number
    primary: any | null
  }
}

export default function AccountDashboard({ profile }: AccountDashboardProps) {
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    orders: { total: 0, lastOrder: null, inTransit: 0 },
    layaways: { active: 0, completed: 0, totalPending: 0, nextPayment: null },
    addresses: { total: 0, primary: null }
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true)
      const newErrors: Record<string, string> = {}

      try {
        // Parallel fetch de 3 tablas
        const [ordersRes, layawaysRes, addressesRes] = await Promise.all([
          supabaseCustomer
            .from('orders')
            .select('id, status, shipping_status, total, created_at')
            .order('created_at', { ascending: false })
            .limit(10),
          
          supabaseCustomer
            .from('layaways')
            .select('id, status, total_amount, amount_paid, amount_remaining, next_payment_due_date, next_payment_amount, created_at')
            .order('created_at', { ascending: false }),
          
          supabaseCustomer
            .from('customer_addresses')
            .select('id, full_name, address_line1, city, state, postal_code, is_default')
            .order('is_default', { ascending: false })
            .order('created_at', { ascending: false })
        ])

        // Process orders
        const orders = ordersRes.data || []
        const ordersData = {
          total: orders.length,
          lastOrder: orders[0] || null,
          inTransit: orders.filter(o => 
            o.shipping_status === 'in_transit' || 
            o.status === 'shipped'
          ).length
        }

        if (ordersRes.error) {
          newErrors.orders = 'Error cargando pedidos'
        }

        // Process layaways
        const layaways = layawaysRes.data || []
        const activeLws = layaways.filter(l => ['active', 'pending'].includes(l.status))
        const completedLws = layaways.filter(l => l.status === 'completed')
        const totalPending = activeLws.reduce((sum, l) => sum + (l.amount_remaining || 0), 0)
        
        // Find next payment (earliest due date among active layaways)
        const upcomingPayments = layaways
          .filter(l => l.status === 'active' && l.next_payment_due_date)
          .sort((a, b) => new Date(a.next_payment_due_date).getTime() - new Date(b.next_payment_due_date).getTime())
        
        const layawaysData = {
          active: activeLws.length,
          completed: completedLws.length,
          totalPending,
          nextPayment: upcomingPayments[0] || null
        }

        if (layawaysRes.error) {
          newErrors.layaways = 'Error cargando apartados'
        }

        // Process addresses
        const addresses = addressesRes.data || []
        const addressesData = {
          total: addresses.length,
          primary: addresses.find(a => a.is_default) || addresses[0] || null
        }

        if (addressesRes.error) {
          newErrors.addresses = 'Error cargando direcciones'
        }

        setDashboardData({
          orders: ordersData,
          layaways: layawaysData,
          addresses: addressesData
        })
        setErrors(newErrors)
      } catch (error) {
        console.error('Error loading dashboard:', error)
        setErrors({
          general: 'Error cargando dashboard. Intenta de nuevo.'
        })
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatShortDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const isProfileComplete = !!(profile.name && profile.phone)

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Welcome skeleton */}
        <div className="animate-pulse bg-gray-200 h-24 rounded-lg" />
        
        {/* Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="animate-pulse bg-gray-200 h-64 rounded-lg" />
          <div className="animate-pulse bg-gray-200 h-64 rounded-lg" />
          <div className="animate-pulse bg-gray-200 h-64 rounded-lg" />
          <div className="animate-pulse bg-gray-200 h-64 rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg shadow-sm p-6 border border-pink-100">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {profile.name 
            ? `Bienvenida a tu espacio Bagclue, ${profile.name}` 
            : 'Bienvenida a tu espacio Bagclue'}
        </h1>
        <p className="text-gray-700 mb-1">{profile.email}</p>
        <p className="text-sm text-gray-600">
          Miembro desde {formatDate(profile.created_at)}
        </p>
      </div>

      {/* General error */}
      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{errors.general}</p>
        </div>
      )}

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Orders Summary Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">📦 Mis Pedidos</h2>
          </div>

          {errors.orders ? (
            <div className="text-red-600 text-sm mb-4">{errors.orders}</div>
          ) : dashboardData.orders.total > 0 ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total de pedidos</span>
                <span className="font-semibold text-gray-900">{dashboardData.orders.total}</span>
              </div>

              {dashboardData.orders.lastOrder && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Último pedido</p>
                  <p className="text-sm text-gray-700">
                    {formatShortDate(dashboardData.orders.lastOrder.created_at)}
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(dashboardData.orders.lastOrder.total)}
                  </p>
                </div>
              )}

              {dashboardData.orders.inTransit > 0 && (
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-purple-700 font-medium">
                      🚚 {dashboardData.orders.inTransit} {dashboardData.orders.inTransit === 1 ? 'pedido' : 'pedidos'} en camino
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500 mb-4">Aún no tienes pedidos</p>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-100">
            <Link 
              href={dashboardData.orders.total > 0 ? "/account/orders" : "/catalogo"}
              className="text-pink-600 hover:text-pink-700 font-medium text-sm flex items-center justify-between group"
            >
              <span>{dashboardData.orders.total > 0 ? 'Ver todos mis pedidos' : 'Explorar catálogo'}</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
        </div>

        {/* Layaways Summary Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">🏷️ Mis Apartados</h2>
          </div>

          {errors.layaways ? (
            <div className="text-red-600 text-sm mb-4">{errors.layaways}</div>
          ) : (dashboardData.layaways.active > 0 || dashboardData.layaways.completed > 0) ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Activos</span>
                <span className="font-semibold text-emerald-600">{dashboardData.layaways.active}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Completados</span>
                <span className="font-semibold text-gray-900">{dashboardData.layaways.completed}</span>
              </div>

              {dashboardData.layaways.totalPending > 0 && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Saldo pendiente total</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(dashboardData.layaways.totalPending)}
                  </p>
                </div>
              )}

              {dashboardData.layaways.nextPayment && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Próxima cuota</p>
                  <p className="text-lg font-semibold text-pink-600">
                    {formatCurrency(dashboardData.layaways.nextPayment.next_payment_amount)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Vence: {formatShortDate(dashboardData.layaways.nextPayment.next_payment_due_date)}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500 mb-4">No tienes apartados activos</p>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-100">
            <Link 
              href={(dashboardData.layaways.active > 0 || dashboardData.layaways.completed > 0) ? "/account/layaways" : "/catalogo"}
              className="text-pink-600 hover:text-pink-700 font-medium text-sm flex items-center justify-between group"
            >
              <span>{(dashboardData.layaways.active > 0 || dashboardData.layaways.completed > 0) ? 'Ver mis apartados' : 'Explorar catálogo'}</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
        </div>

        {/* Addresses Summary Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">📍 Mis Direcciones</h2>
          </div>

          {errors.addresses ? (
            <div className="text-red-600 text-sm mb-4">{errors.addresses}</div>
          ) : dashboardData.addresses.total > 0 ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Direcciones guardadas</span>
                <span className="font-semibold text-gray-900">{dashboardData.addresses.total}</span>
              </div>

              {dashboardData.addresses.primary && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2">Dirección principal</p>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p className="font-medium">{dashboardData.addresses.primary.full_name}</p>
                    <p>{dashboardData.addresses.primary.address_line1}</p>
                    <p>{dashboardData.addresses.primary.city}, {dashboardData.addresses.primary.state}</p>
                    <p>{dashboardData.addresses.primary.postal_code}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500 mb-4">No tienes direcciones guardadas</p>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-100">
            <Link 
              href="/account/addresses"
              className="text-pink-600 hover:text-pink-700 font-medium text-sm flex items-center justify-between group"
            >
              <span>{dashboardData.addresses.total > 0 ? 'Gestionar direcciones' : 'Agregar dirección'}</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
        </div>

        {/* Profile Summary Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">👤 Mi Perfil</h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {isProfileComplete ? (
                <>
                  <span className="text-2xl">✅</span>
                  <span className="text-sm font-medium text-emerald-600">Perfil completo</span>
                </>
              ) : (
                <>
                  <span className="text-2xl">⚠️</span>
                  <span className="text-sm font-medium text-yellow-600">Perfil incompleto</span>
                </>
              )}
            </div>

            {profile.phone && profile.phone_country_code ? (
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Teléfono registrado</p>
                <p className="text-sm text-gray-700">
                  {profile.phone_country_code} {profile.phone}
                </p>
              </div>
            ) : (
              <div className="pt-3 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                  {!isProfileComplete && 'Agrega tu nombre y teléfono para completar tu perfil'}
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <Link 
              href="/account/profile"
              className="text-pink-600 hover:text-pink-700 font-medium text-sm flex items-center justify-between group"
            >
              <span>{isProfileComplete ? 'Editar perfil' : 'Completar perfil'}</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Accesos rápidos</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Link 
            href="/account/orders"
            className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-pink-300 hover:bg-pink-50 transition-all group"
          >
            <span className="text-3xl mb-2">📦</span>
            <span className="text-sm font-medium text-gray-700 group-hover:text-pink-600">Mis Pedidos</span>
          </Link>

          <Link 
            href="/account/layaways"
            className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-pink-300 hover:bg-pink-50 transition-all group"
          >
            <span className="text-3xl mb-2">🏷️</span>
            <span className="text-sm font-medium text-gray-700 group-hover:text-pink-600">Mis Apartados</span>
          </Link>

          <Link 
            href="/account/addresses"
            className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-pink-300 hover:bg-pink-50 transition-all group"
          >
            <span className="text-3xl mb-2">📍</span>
            <span className="text-sm font-medium text-gray-700 group-hover:text-pink-600">Mis Direcciones</span>
          </Link>

          <Link 
            href="/account/profile"
            className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-pink-300 hover:bg-pink-50 transition-all group"
          >
            <span className="text-3xl mb-2">👤</span>
            <span className="text-sm font-medium text-gray-700 group-hover:text-pink-600">Perfil</span>
          </Link>

          <Link 
            href="/catalogo"
            className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-pink-300 hover:bg-pink-50 transition-all group"
          >
            <span className="text-3xl mb-2">🛍️</span>
            <span className="text-sm font-medium text-gray-700 group-hover:text-pink-600">Catálogo</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

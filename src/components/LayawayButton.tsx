'use client'

import { useState } from 'react'

interface LayawayButtonProps {
  product: {
    id: string
    price: number
    currency: string
    brand?: string
  }
}

type Step = 'plans' | 'amount' | 'customer'
type PlanWeeks = 4 | 8 | 18

// Helper functions for Hermès brand detection
function normalizeBrand(brand: string): string {
  return brand.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

function isHermes(brand: string): boolean {
  const normalized = normalizeBrand(brand)
  return normalized === 'hermes'
}

export default function LayawayButton({ product }: LayawayButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [step, setStep] = useState<Step>('plans')
  const [selectedPlan, setSelectedPlan] = useState<PlanWeeks | null>(null)
  const [firstPaymentAmount, setFirstPaymentAmount] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: ''
  })

  // Check if product is Hermès
  const isHermesBrand = isHermes(product.brand || '')
  
  // Determine available plans based on brand
  const availablePlans: PlanWeeks[] = isHermesBrand 
    ? [4, 8]  // Hermès: only 4 and 8 weeks
    : [4, 8, 18]  // Other brands: 4, 8, 18 weeks
  
  // Calculate plan prices
  const price_cash = product.price
  const price_4_weeks = price_cash
  const price_8_weeks = isHermesBrand ? price_cash : Math.round(price_cash * 1.035)
  const price_18_weeks = Math.round(price_cash * 1.056)

  const getPlanPrice = (weeks: PlanWeeks): number => {
    if (isHermesBrand) {
      // Hermès: no increment
      return price_cash
    }
    // Other brands: normal increment
    switch(weeks) {
      case 4: return price_4_weeks
      case 8: return price_8_weeks
      case 18: return price_18_weeks
    }
  }
  
  const getPlanIncrement = (weeks: PlanWeeks): string => {
    if (isHermesBrand) {
      return 'Sin incremento'
    }
    switch(weeks) {
      case 4: return 'Sin incremento'
      case 8: return '+3.5%'
      case 18: return '+5.6%'
    }
  }
  
  const getPlanBadgeColor = (weeks: PlanWeeks): string => {
    if (isHermesBrand || weeks === 4) {
      return 'bg-green-100 text-green-700'
    }
    switch(weeks) {
      case 8: return 'bg-blue-100 text-blue-700'
      case 18: return 'bg-purple-100 text-purple-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const STRIPE_MINIMUM_MXN = 10 // Stripe minimum ~$0.50 USD
  const selectedPlanPrice = selectedPlan ? getPlanPrice(selectedPlan) : 0
  const minimumPaymentCalculated = selectedPlan ? Math.ceil(selectedPlanPrice / selectedPlan) : 0
  const minimumPayment = Math.max(minimumPaymentCalculated, STRIPE_MINIMUM_MXN)
  const amountRemaining = Math.max(0, selectedPlanPrice - firstPaymentAmount)
  const paymentsRemaining = selectedPlan ? selectedPlan - 1 : 0
  const nextPaymentAmount = paymentsRemaining > 0 && amountRemaining > 0
    ? Math.ceil(amountRemaining / paymentsRemaining)
    : 0
  const nextPaymentDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  // Format numbers consistently
  const formatCurrency = (amount: number) => amount.toLocaleString('es-MX')

  // Calculate minimum payment for display (applies Stripe minimum)
  const getMinimumPaymentForPlan = (planPrice: number, weeks: number): number => {
    const calculated = Math.ceil(planPrice / weeks)
    return Math.max(calculated, STRIPE_MINIMUM_MXN)
  }

  const handlePlanSelect = (weeks: PlanWeeks) => {
    setSelectedPlan(weeks)
    const planPrice = getPlanPrice(weeks)
    const minPaymentCalculated = Math.ceil(planPrice / weeks)
    const minPayment = Math.max(minPaymentCalculated, STRIPE_MINIMUM_MXN)
    setFirstPaymentAmount(minPayment) // Set default to minimum
    setError('')
    setStep('amount')
  }

  const handleAmountChange = (value: string) => {
    const amount = parseInt(value) || 0
    setFirstPaymentAmount(amount)
    
    // Validate
    if (amount < minimumPayment) {
      setError(`El pago mínimo es $${formatCurrency(minimumPayment)} MXN`)
    } else if (amount > selectedPlanPrice) {
      setError(`El pago máximo es $${formatCurrency(selectedPlanPrice)} MXN`)
    } else {
      setError('')
    }
  }

  const handleContinueToCustomer = () => {
    if (firstPaymentAmount < minimumPayment) {
      setError(`El pago mínimo es $${formatCurrency(minimumPayment)} MXN`)
      return
    }
    if (firstPaymentAmount > selectedPlanPrice) {
      setError(`El pago máximo es $${formatCurrency(selectedPlanPrice)} MXN`)
      return
    }
    setError('')
    setStep('customer')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedPlan || !firstPaymentAmount) {
      setError('Información incompleta')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/layaways/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          customer_name: formData.customer_name,
          customer_email: formData.customer_email,
          customer_phone: formData.customer_phone,
          plan_weeks: selectedPlan,
          first_payment_amount: firstPaymentAmount
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear apartado')
      }

      // Redirect to Stripe Checkout
      if (data.checkout_url) {
        window.location.href = data.checkout_url
      }
    } catch (error: any) {
      setError(error.message || 'Error al procesar apartado')
      setLoading(false)
    }
  }

  const resetModal = () => {
    setShowModal(false)
    setStep('plans')
    setSelectedPlan(null)
    setFirstPaymentAmount(0)
    setError('')
    setFormData({ customer_name: '', customer_email: '', customer_phone: '' })
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full border-2 border-[#E85A9A] text-[#E85A9A] py-3 hover:bg-[#E85A9A] hover:text-white transition-colors rounded-lg"
      >
        <span className="block font-medium">
          Apartar con pagos semanales
        </span>
        <span className="text-xs block mt-1">
          {isHermesBrand 
            ? 'Elige entre 4 u 8 semanas. Puedes adelantar más en tu primer pago.'
            : 'Elige entre 4, 8 o 18 semanas. Puedes adelantar más en tu primer pago.'
          }
        </span>
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white max-w-2xl w-full p-6 relative my-8 rounded-lg">
            <button
              onClick={resetModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
            >
              ✕
            </button>

            {/* STEP 1: Select Plan */}
            {step === 'plans' && (
              <div>
                <h2 className="text-2xl font-[family-name:var(--font-playfair)] text-gray-900 mb-2">
                  Elige tu plan de apartado
                </h2>
                <p className="text-gray-600 mb-6">
                  Aparta tu pieza con tu primer pago semanal. Puedes adelantar más si lo deseas.
                </p>

                <div className="space-y-4">
                  {availablePlans.map(weeks => {
                    const planPrice = getPlanPrice(weeks)
                    const paymentsRemaining = weeks - 1
                    
                    return (
                      <button
                        key={weeks}
                        onClick={() => handlePlanSelect(weeks)}
                        className="w-full border-2 border-gray-200 hover:border-[#E85A9A] p-4 rounded-lg text-left transition-colors group"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#E85A9A]">
                            Plan {weeks} semanas
                          </h3>
                          <span className={`px-3 py-1 ${getPlanBadgeColor(weeks)} text-sm font-medium rounded`}>
                            {weeks === 4 && !isHermesBrand && '✨ '}{getPlanIncrement(weeks)}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p><strong>Precio final:</strong> ${formatCurrency(planPrice)} {product.currency}</p>
                          <p><strong>Primer pago desde:</strong> ${formatCurrency(getMinimumPaymentForPlan(planPrice, weeks))} {product.currency}</p>
                          <p><strong>Pagos restantes:</strong> {paymentsRemaining} {paymentsRemaining === 1 ? 'pago semanal' : 'pagos semanales'}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* STEP 2: Select Amount */}
            {step === 'amount' && selectedPlan && (
              <div>
                <button
                  onClick={() => setStep('plans')}
                  className="text-gray-600 hover:text-gray-900 mb-4 flex items-center text-sm"
                >
                  ← Volver a planes
                </button>

                <h2 className="text-2xl font-[family-name:var(--font-playfair)] text-gray-900 mb-2">
                  ¿Cuánto quieres pagar hoy?
                </h2>
                <p className="text-gray-600 mb-4">
                  Plan elegido: <strong>{selectedPlan} semanas</strong> · Precio final: <strong>${formatCurrency(selectedPlanPrice)} {product.currency}</strong>
                </p>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto del primer pago *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-500">$</span>
                    <input
                      type="number"
                      min={minimumPayment}
                      max={selectedPlanPrice}
                      value={firstPaymentAmount || ''}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      className={`w-full border ${error ? 'border-red-500' : 'border-gray-300'} pl-8 pr-3 py-2 rounded focus:border-[#E85A9A] focus:outline-none text-lg`}
                      placeholder={minimumPayment.toString()}
                    />
                    <span className="absolute right-3 top-3 text-gray-500">{product.currency}</span>
                  </div>
                  {error && (
                    <p className="text-red-600 text-sm mt-1">{error}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    Mínimo: ${formatCurrency(minimumPayment)} {product.currency} · Máximo: ${formatCurrency(selectedPlanPrice)} {product.currency}
                  </p>
                </div>

                {firstPaymentAmount >= selectedPlanPrice ? (
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-6">
                    <p className="text-green-800 font-medium">
                      ✅ Liquidarás el apartado hoy mismo
                    </p>
                    <p className="text-green-700 text-sm mt-1">
                      Tu pieza será enviada una vez confirmado el pago.
                    </p>
                  </div>
                ) : firstPaymentAmount >= minimumPayment ? (
                  <div className="bg-[#E85A9A]/5 border border-[#E85A9A]/20 p-4 rounded-lg mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">✅ Resumen</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pago hoy</span>
                        <span className="font-medium text-gray-900">${formatCurrency(firstPaymentAmount)} {product.currency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Saldo restante</span>
                        <span className="font-medium text-gray-900">${formatCurrency(amountRemaining)} {product.currency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pagos faltantes</span>
                        <span className="font-medium text-gray-900">{paymentsRemaining} pagos semanales</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-[#E85A9A]/20">
                        <span className="text-gray-600">Pago semanal estimado</span>
                        <span className="font-medium text-[#E85A9A]">${formatCurrency(nextPaymentAmount)} {product.currency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Próximo pago</span>
                        <span className="font-medium text-gray-900">
                          {nextPaymentDate.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : null}

                <button
                  onClick={handleContinueToCustomer}
                  disabled={!firstPaymentAmount || firstPaymentAmount < minimumPayment || firstPaymentAmount > selectedPlanPrice}
                  className="w-full bg-[#E85A9A] text-white py-3 hover:bg-[#EC5C9F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium"
                >
                  Continuar
                </button>
              </div>
            )}

            {/* STEP 3: Customer Info */}
            {step === 'customer' && selectedPlan && (
              <div>
                <button
                  onClick={() => setStep('amount')}
                  className="text-gray-600 hover:text-gray-900 mb-4 flex items-center text-sm"
                >
                  ← Volver a monto
                </button>

                <h2 className="text-2xl font-[family-name:var(--font-playfair)] text-gray-900 mb-4">
                  Confirma tu apartado
                </h2>

                {/* Summary */}
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg mb-6">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Plan</span>
                      <span className="font-medium text-gray-900">{selectedPlan} semanas</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pago hoy</span>
                      <span className="font-medium text-gray-900">${formatCurrency(firstPaymentAmount)} {product.currency}</span>
                    </div>
                    {firstPaymentAmount < selectedPlanPrice && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Saldo restante</span>
                          <span className="font-medium text-gray-900">${formatCurrency(amountRemaining)} {product.currency}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Pago semanal</span>
                          <span className="font-medium text-[#E85A9A]">${formatCurrency(nextPaymentAmount)} {product.currency}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.customer_name}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                      className="w-full border border-gray-300 px-3 py-2 rounded focus:border-[#E85A9A] focus:outline-none"
                      placeholder="María García"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.customer_email}
                      onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                      className="w-full border border-gray-300 px-3 py-2 rounded focus:border-[#E85A9A] focus:outline-none"
                      placeholder="maria@ejemplo.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono (opcional)
                    </label>
                    <input
                      type="tel"
                      value={formData.customer_phone}
                      onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                      className="w-full border border-gray-300 px-3 py-2 rounded focus:border-[#E85A9A] focus:outline-none"
                      placeholder="+52 55 1234 5678"
                    />
                  </div>

                  <div className="text-xs text-gray-600 space-y-1 pt-2">
                    <p>• Pagas cada semana hasta completar el plan</p>
                    <p>• El depósito <strong>no es reembolsable</strong></p>
                    <p>• Recibirás un link de seguimiento por email</p>
                  </div>

                  {error && (
                    <p className="text-red-600 text-sm">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#E85A9A] text-white py-3 hover:bg-[#EC5C9F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium"
                  >
                    {loading ? 'Procesando...' : `Continuar al pago de $${formatCurrency(firstPaymentAmount)}`}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

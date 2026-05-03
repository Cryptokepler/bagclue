'use client'

import { useState } from 'react'

interface PayBalanceButtonProps {
  layawayId: string
  balanceAmount: number
  currency: string
}

export default function PayBalanceButton({ layawayId, balanceAmount, currency }: PayBalanceButtonProps) {
  const [loading, setLoading] = useState(false)

  const handlePayBalance = async () => {
    setLoading(true)
    
    try {
      const response = await fetch(`/api/layaways/${layawayId}/pay-balance`, {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar pago')
      }
      
      if (data.checkout_url) {
        window.location.href = data.checkout_url
      }
    } catch (error: any) {
      alert(error.message || 'Error al procesar pago')
      setLoading(false)
    }
  }

  return (
    <div className="mb-6">
      <button
        onClick={handlePayBalance}
        disabled={loading}
        className="w-full bg-[#FF69B4] text-white py-4 text-lg hover:bg-[#FF69B4]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Procesando...' : `Pagar saldo restante ($${balanceAmount.toLocaleString()} ${currency})`}
      </button>
      <p className="text-xs text-gray-600 text-center mt-2">
        Pagarás de forma segura con Stripe
      </p>
    </div>
  )
}

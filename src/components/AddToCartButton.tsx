'use client'

import { useCart } from '@/contexts/CartContext'
import { useState, useEffect } from 'react'

interface AddToCartButtonProps {
  product: {
    id: string
    slug: string
    title: string
    brand: string
    price: number | null
    currency: string
    status: string
    image?: string
  }
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const { addToCart, items } = useCart()
  const [added, setAdded] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Fix hydration mismatch: wait for client mount before reading cart from localStorage
  useEffect(() => {
    setMounted(true)
  }, [])

  const isInCart = mounted && items.some(item => item.product_id === product.id)
  const canPurchase = product.status === 'available' && product.price !== null

  const handleAdd = () => {
    if (!canPurchase) return

    addToCart({
      product_id: product.id,
      slug: product.slug,
      title: product.title,
      brand: product.brand,
      price: product.price!,
      currency: product.currency,
      image: product.image || ''
    })

    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  if (!canPurchase) {
    return (
      <button
        disabled
        className="w-full border border-gray-300 text-gray-400 py-3 cursor-not-allowed"
      >
        {product.status === 'sold' && 'Vendido'}
        {product.status === 'reserved' && 'Reservado'}
        {product.status === 'hidden' && 'No disponible'}
        {product.status === 'preorder' && 'Pre-venta (próximamente)'}
        {product.price === null && 'Consultar precio'}
      </button>
    )
  }

  // Prevent hydration mismatch: render stable button until mounted
  // Server always renders "Agregar al Carrito", client shows cart link only after mount
  if (!mounted) {
    return (
      <button
        className="w-full bg-[#E85A9A] text-white py-3 hover:bg-[#EC5C9F] transition-colors rounded-lg"
      >
        Agregar al Carrito
      </button>
    )
  }

  if (isInCart) {
    return (
      <a
        href="/cart"
        className="block w-full border-2 border-[#E85A9A] text-[#E85A9A] py-3 text-center hover:bg-[#E85A9A] hover:text-white transition-colors rounded-lg"
      >
        Ver en Carrito →
      </a>
    )
  }

  return (
    <button
      onClick={handleAdd}
      className="w-full bg-[#E85A9A] text-white py-3 hover:bg-[#EC5C9F] transition-colors rounded-lg"
    >
      {added ? '✓ Agregado al carrito' : 'Agregar al Carrito'}
    </button>
  )
}

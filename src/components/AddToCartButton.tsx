'use client'

import { useCart } from '@/contexts/CartContext'
import { useState } from 'react'

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

  const isInCart = items.some(item => item.product_id === product.id)
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

  if (isInCart) {
    return (
      <a
        href="/cart"
        className="block w-full border border-[#FF69B4] text-[#FF69B4] py-3 text-center hover:bg-[#FF69B4] hover:text-white transition-colors"
      >
        Ver en Carrito →
      </a>
    )
  }

  return (
    <button
      onClick={handleAdd}
      className="w-full bg-[#FF69B4] text-white py-3 hover:bg-[#FF69B4]/90 transition-colors"
    >
      {added ? '✓ Agregado al carrito' : 'Agregar al Carrito'}
    </button>
  )
}

'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface CartItem {
  product_id: string
  slug: string
  title: string
  brand: string
  price: number | null
  currency: string
  image: string
  quantity: number
}

interface CartContextType {
  items: CartItem[]
  addToCart: (item: Omit<CartItem, 'quantity'>) => void
  removeFromCart: (product_id: string) => void
  clearCart: () => void
  cartTotal: number
  itemCount: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [mounted, setMounted] = useState(false)

  // Load cart from localStorage on mount
  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('bagclue_cart')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setItems(parsed.items || [])
      } catch (e) {
        console.error('Error parsing cart:', e)
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('bagclue_cart', JSON.stringify({ items }))
    }
  }, [items, mounted])

  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    setItems(prev => {
      const existing = prev.find(i => i.product_id === item.product_id)
      if (existing) {
        // Ya está en carrito, no incrementar (productos únicos)
        return prev
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const removeFromCart = (product_id: string) => {
    setItems(prev => prev.filter(i => i.product_id !== product_id))
  }

  const clearCart = () => {
    setItems([])
  }

  const cartTotal = items.reduce((sum, item) => {
    return sum + (item.price || 0) * item.quantity
  }, 0)

  const itemCount = items.length

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, clearCart, cartTotal, itemCount }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}

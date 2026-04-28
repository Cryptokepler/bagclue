'use client'

import { useCart } from '@/contexts/CartContext'
import Link from 'next/link'

export default function CartIcon() {
  const { itemCount } = useCart()

  return (
    <Link href="/cart" className="relative group">
      <svg
        className="w-6 h-6 text-gray-900 group-hover:text-[#FF69B4] transition-colors"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
        />
      </svg>
      {itemCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-[#FF69B4] text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
          {itemCount}
        </span>
      )}
    </Link>
  )
}

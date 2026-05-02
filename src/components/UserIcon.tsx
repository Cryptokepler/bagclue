'use client'

import Link from 'next/link'

export default function UserIcon() {
  return (
    <Link href="/account" className="relative group">
      <svg
        className="w-5 h-5 text-gray-900 group-hover:text-[#FF69B4] transition-colors"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    </Link>
  )
}

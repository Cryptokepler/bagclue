'use client'

import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'
import Navbar from './Navbar'
import Footer from './Footer'

export default function ConditionalLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith('/admin')

  if (isAdmin) {
    // Admin routes: no navbar, no footer
    return <>{children}</>
  }

  // Public routes: show navbar and footer
  return (
    <>
      <Navbar />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  )
}

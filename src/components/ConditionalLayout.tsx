'use client'

import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'
import Navbar from './Navbar'
import TrackingHeader from './TrackingHeader'
import Footer from './Footer'

export default function ConditionalLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith('/admin')
  const isTracking = pathname.startsWith('/track/') || pathname.startsWith('/layaway/')

  if (isAdmin) {
    // Admin routes: no navbar, no footer
    return <>{children}</>
  }

  if (isTracking) {
    // Tracking routes: simplified header
    return (
      <>
        <TrackingHeader />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </>
    )
  }

  // Public routes: full navbar and footer
  return (
    <>
      <Navbar />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  )
}

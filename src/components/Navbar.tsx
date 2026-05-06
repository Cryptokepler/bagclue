'use client';

import Link from 'next/link';
import { useState } from 'react';
import CartIcon from './CartIcon';
import MegaMenu from './MegaMenu';

const navLinks = [
  { href: '/catalogo', label: 'Catálogo', type: 'link' as const },
  { href: '#', label: 'Diseñadores', type: 'megamenu' as const },
  { href: '/catalogo', label: 'Recién llegadas', type: 'link' as const },
  { href: '/apartado', label: 'Apartado', type: 'link' as const },
  { href: '/#autenticidad', label: 'Autenticidad', type: 'link' as const },
  { href: '/nosotros', label: 'Nosotros', type: 'link' as const },
  { href: '/contacto', label: 'Contacto', type: 'link' as const },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [disenadoresExpanded, setDisenadoresExpanded] = useState(false);
  const [categoriasExpanded, setCategoriasExpanded] = useState(false);

  return (
    <nav className={`transition-all duration-300 bg-white border-b border-gray-100 relative`}>
      <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link href="/" className="font-[family-name:var(--font-playfair)] text-2xl tracking-[0.3em] text-[#0B0B0B] hover:text-[#E85A9A] transition-colors">
          BAGCLUE
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map(l => (
            l.type === 'megamenu' ? (
              <div 
                key={l.label}
                className="relative"
                onMouseEnter={() => setMegaMenuOpen(true)}
                onMouseLeave={() => setMegaMenuOpen(false)}
              >
                <button 
                  className="text-sm tracking-widest uppercase text-gray-600 hover:text-[#E85A9A] transition-colors flex items-center gap-1"
                >
                  {l.label}
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            ) : (
              <Link 
                key={l.href + l.label} 
                href={l.href} 
                className="text-sm tracking-widest uppercase text-gray-600 hover:text-[#E85A9A] transition-colors"
              >
                {l.label}
              </Link>
            )
          ))}
          <a href="https://instagram.com/salebybagcluemx" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-[#E85A9A] transition-colors" aria-label="Instagram">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          </a>
          <Link href="/account" className="text-sm tracking-widest uppercase text-gray-600 hover:text-[#E85A9A] transition-colors">
            Mi cuenta
          </Link>
          <CartIcon />
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-gray-900" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Mega Menu Desktop */}
      <MegaMenu isOpen={megaMenuOpen} onClose={() => setMegaMenuOpen(false)} />

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white/98 backdrop-blur-md border-t border-gray-100 animate-fade-in">
          <div className="px-6 py-6 flex flex-col gap-4">
            <Link href="/catalogo" onClick={() => setMobileOpen(false)} className="text-sm tracking-widest uppercase text-gray-600 hover:text-[#E85A9A] transition-colors py-2">
              Catálogo
            </Link>

            {/* Diseñadores expandible */}
            <div>
              <button 
                onClick={() => setDisenadoresExpanded(!disenadoresExpanded)}
                className="w-full flex items-center justify-between text-sm tracking-widest uppercase text-gray-600 hover:text-[#E85A9A] transition-colors py-2"
              >
                Diseñadores
                <svg className={`w-4 h-4 transition-transform ${disenadoresExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {disenadoresExpanded && (
                <div className="pl-4 mt-2 space-y-2 border-l-2 border-[#E85A9A]/20">
                  <Link href="/catalogo" onClick={() => setMobileOpen(false)} className="block text-sm text-gray-600 hover:text-[#E85A9A] py-1">Chanel</Link>
                  <Link href="/catalogo" onClick={() => setMobileOpen(false)} className="block text-sm text-gray-600 hover:text-[#E85A9A] py-1">Hermès</Link>
                  <Link href="/catalogo" onClick={() => setMobileOpen(false)} className="block text-sm text-gray-600 hover:text-[#E85A9A] py-1">Louis Vuitton</Link>
                  <Link href="/catalogo" onClick={() => setMobileOpen(false)} className="block text-sm text-gray-600 hover:text-[#E85A9A] py-1">Dior</Link>
                  <Link href="/catalogo" onClick={() => setMobileOpen(false)} className="block text-sm text-gray-600 hover:text-[#E85A9A] py-1">Goyard</Link>
                  <Link href="/catalogo" onClick={() => setMobileOpen(false)} className="block text-sm text-[#E85A9A] font-medium py-1">Todas las marcas →</Link>
                </div>
              )}
            </div>

            {/* Categorías expandible */}
            <div>
              <button 
                onClick={() => setCategoriasExpanded(!categoriasExpanded)}
                className="w-full flex items-center justify-between text-sm tracking-widest uppercase text-gray-600 hover:text-[#E85A9A] transition-colors py-2"
              >
                Categorías
                <svg className={`w-4 h-4 transition-transform ${categoriasExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {categoriasExpanded && (
                <div className="pl-4 mt-2 space-y-2 border-l-2 border-[#E85A9A]/20">
                  <Link href="/catalogo" onClick={() => setMobileOpen(false)} className="block text-sm text-gray-600 hover:text-[#E85A9A] py-1">Bolsas</Link>
                  <Link href="/catalogo" onClick={() => setMobileOpen(false)} className="block text-sm text-gray-600 hover:text-[#E85A9A] py-1">Zapatos</Link>
                  <Link href="/catalogo" onClick={() => setMobileOpen(false)} className="block text-sm text-gray-600 hover:text-[#E85A9A] py-1">Joyería</Link>
                  <Link href="/catalogo" onClick={() => setMobileOpen(false)} className="block text-sm text-gray-600 hover:text-[#E85A9A] py-1">Accesorios</Link>
                </div>
              )}
            </div>

            <Link href="/catalogo" onClick={() => setMobileOpen(false)} className="text-sm tracking-widest uppercase text-gray-600 hover:text-[#E85A9A] transition-colors py-2 flex items-center gap-2">
              Recién llegadas
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] tracking-wider uppercase bg-[#FFF4A8] text-[#0B0B0B]">
                New
              </span>
            </Link>

            <Link href="/apartado" onClick={() => setMobileOpen(false)} className="text-sm tracking-widest uppercase text-gray-600 hover:text-[#E85A9A] transition-colors py-2">
              Apartado
            </Link>

            <Link href="/#autenticidad" onClick={() => setMobileOpen(false)} className="text-sm tracking-widest uppercase text-gray-600 hover:text-[#E85A9A] transition-colors py-2">
              Autenticidad
            </Link>

            <Link href="/nosotros" onClick={() => setMobileOpen(false)} className="text-sm tracking-widest uppercase text-gray-600 hover:text-[#E85A9A] transition-colors py-2">
              Nosotros
            </Link>

            <Link href="/contacto" onClick={() => setMobileOpen(false)} className="text-sm tracking-widest uppercase text-gray-600 hover:text-[#E85A9A] transition-colors py-2">
              Contacto
            </Link>

            <Link href="/account" onClick={() => setMobileOpen(false)} className="text-sm tracking-widest uppercase text-gray-600 hover:text-[#E85A9A] transition-colors py-2">
              Mi cuenta
            </Link>

            <a href="https://ig.me/m/salebybagcluemx" target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center justify-center gap-2 bg-[#E85A9A] text-white px-6 py-3 text-sm tracking-widest uppercase font-medium hover:bg-[#EC5C9F] transition-colors rounded-full">
              Contactar por Instagram
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}

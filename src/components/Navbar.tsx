'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

const navLinks = [
  { href: '/', label: 'Inicio' },
  { href: '/catalogo', label: 'Catálogo' },
  { href: '/apartado', label: 'Apartado' },
  { href: '/paris', label: 'París 2U' },
  { href: '/nosotros', label: 'Nosotros' },
  { href: '/contacto', label: 'Contacto' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#0A0A0A]/95 backdrop-blur-md border-b border-[#C9A96E]/10' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-[family-name:var(--font-playfair)] text-2xl tracking-[0.3em] text-[#C9A96E] hover:text-[#F5F0EB] transition-colors">
          BAGCLUE
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map(l => (
            <Link key={l.href} href={l.href} className="text-sm tracking-widest uppercase text-[#F5F0EB]/70 hover:text-[#C9A96E] transition-colors">
              {l.label}
            </Link>
          ))}
          <a href="https://instagram.com/salebybagcluemx" target="_blank" rel="noopener noreferrer" className="text-[#F5F0EB]/70 hover:text-[#C9A96E] transition-colors" aria-label="Instagram">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          </a>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-[#F5F0EB]" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#0A0A0A]/98 backdrop-blur-md border-t border-[#C9A96E]/10 animate-fade-in">
          <div className="px-6 py-6 flex flex-col gap-4">
            {navLinks.map(l => (
              <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="text-sm tracking-widest uppercase text-[#F5F0EB]/70 hover:text-[#C9A96E] transition-colors py-2">
                {l.label}
              </Link>
            ))}
            <a href="https://ig.me/m/salebybagcluemx" target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center justify-center gap-2 bg-[#C9A96E] text-[#0A0A0A] px-6 py-3 text-sm tracking-widest uppercase font-medium hover:bg-[#F5F0EB] transition-colors">
              Contactar por Instagram
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}

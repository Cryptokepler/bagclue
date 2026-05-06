'use client';

import Link from 'next/link';

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MegaMenu({ isOpen, onClose }: MegaMenuProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="absolute top-full left-0 right-0 bg-[#FFFBF8] border-t border-[#E85A9A]/10 shadow-2xl z-40"
    >
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Columna 1: Diseñadores */}
          <div>
            <h3 className="text-xs tracking-[0.3em] uppercase text-[#0B0B0B] font-semibold mb-6">
              Diseñadores
            </h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  href="/catalogo" 
                  onClick={onClose}
                  className="text-sm text-gray-600 hover:text-[#E85A9A] transition-colors block"
                >
                  Chanel
                </Link>
              </li>
              <li>
                <Link 
                  href="/catalogo" 
                  onClick={onClose}
                  className="text-sm text-gray-600 hover:text-[#E85A9A] transition-colors block"
                >
                  Hermès
                </Link>
              </li>
              <li>
                <Link 
                  href="/catalogo" 
                  onClick={onClose}
                  className="text-sm text-gray-600 hover:text-[#E85A9A] transition-colors block"
                >
                  Louis Vuitton
                </Link>
              </li>
              <li>
                <Link 
                  href="/catalogo" 
                  onClick={onClose}
                  className="text-sm text-gray-600 hover:text-[#E85A9A] transition-colors block"
                >
                  Dior
                </Link>
              </li>
              <li>
                <Link 
                  href="/catalogo" 
                  onClick={onClose}
                  className="text-sm text-gray-600 hover:text-[#E85A9A] transition-colors block"
                >
                  Goyard
                </Link>
              </li>
              <li className="pt-2">
                <Link 
                  href="/catalogo" 
                  onClick={onClose}
                  className="text-sm text-[#E85A9A] hover:text-[#EC5C9F] font-medium transition-colors block"
                >
                  Ver todos →
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 2: Categorías */}
          <div>
            <h3 className="text-xs tracking-[0.3em] uppercase text-[#0B0B0B] font-semibold mb-6">
              Categorías
            </h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  href="/catalogo" 
                  onClick={onClose}
                  className="text-sm text-gray-600 hover:text-[#E85A9A] transition-colors block"
                >
                  Bolsas
                </Link>
              </li>
              <li>
                <Link 
                  href="/catalogo" 
                  onClick={onClose}
                  className="text-sm text-gray-600 hover:text-[#E85A9A] transition-colors block"
                >
                  Zapatos
                </Link>
              </li>
              <li>
                <Link 
                  href="/catalogo" 
                  onClick={onClose}
                  className="text-sm text-gray-600 hover:text-[#E85A9A] transition-colors block"
                >
                  Joyería
                </Link>
              </li>
              <li>
                <Link 
                  href="/catalogo" 
                  onClick={onClose}
                  className="text-sm text-gray-600 hover:text-[#E85A9A] transition-colors block"
                >
                  Accesorios
                </Link>
              </li>
              <li className="pt-2">
                <Link 
                  href="/catalogo" 
                  onClick={onClose}
                  className="text-sm text-[#E85A9A] hover:text-[#EC5C9F] font-medium transition-colors flex items-center gap-1"
                >
                  Recién llegadas
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] tracking-wider uppercase bg-[#FFF4A8] text-[#0B0B0B]">
                    New
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Modelos / Colecciones */}
          <div>
            <h3 className="text-xs tracking-[0.3em] uppercase text-[#0B0B0B] font-semibold mb-6">
              Modelos
            </h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  href="/catalogo" 
                  onClick={onClose}
                  className="text-sm text-gray-600 hover:text-[#E85A9A] transition-colors block"
                >
                  Classic Flap
                </Link>
              </li>
              <li>
                <Link 
                  href="/catalogo" 
                  onClick={onClose}
                  className="text-sm text-gray-600 hover:text-[#E85A9A] transition-colors block"
                >
                  Chanel 25
                </Link>
              </li>
              <li>
                <Link 
                  href="/catalogo" 
                  onClick={onClose}
                  className="text-sm text-gray-600 hover:text-[#E85A9A] transition-colors block"
                >
                  Birkin
                </Link>
              </li>
              <li>
                <Link 
                  href="/catalogo" 
                  onClick={onClose}
                  className="text-sm text-gray-600 hover:text-[#E85A9A] transition-colors block"
                >
                  Kelly
                </Link>
              </li>
              <li>
                <Link 
                  href="/catalogo" 
                  onClick={onClose}
                  className="text-sm text-gray-600 hover:text-[#E85A9A] transition-colors block"
                >
                  Wallet on Chain
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 4: Destacado / CTA */}
          <div>
            <h3 className="text-xs tracking-[0.3em] uppercase text-[#0B0B0B] font-semibold mb-6">
              Explora
            </h3>
            <div className="space-y-4">
              <Link 
                href="/catalogo" 
                onClick={onClose}
                className="block p-6 bg-white border border-[#E85A9A]/10 rounded-xl hover:border-[#E85A9A]/30 transition-all group"
              >
                <div className="text-sm font-medium text-[#0B0B0B] mb-2 flex items-center gap-2">
                  Ver catálogo completo
                  <svg className="w-4 h-4 text-[#E85A9A] group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <p className="text-xs text-gray-600">
                  Explora todas las piezas disponibles
                </p>
              </Link>

              <div className="p-4 bg-[#E85A9A]/5 rounded-xl border border-[#E85A9A]/10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] tracking-wider uppercase bg-[#FFF4A8] text-[#0B0B0B] font-medium">
                    Pieza única
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  Cada pieza es verificada y única
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

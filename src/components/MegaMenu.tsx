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
      onMouseLeave={onClose}
    >
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Columna 1: Chanel */}
          <div>
            <h3 className="text-xs tracking-[0.3em] uppercase text-[#0B0B0B] font-semibold mb-6">
              Chanel
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
                  Boy
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
              <li className="pt-2">
                <Link 
                  href="/catalogo" 
                  onClick={onClose}
                  className="text-sm text-[#E85A9A] hover:text-[#EC5C9F] font-medium transition-colors block"
                >
                  Ver todo Chanel →
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 2: Hermès */}
          <div>
            <h3 className="text-xs tracking-[0.3em] uppercase text-[#0B0B0B] font-semibold mb-6">
              Hermès
            </h3>
            <ul className="space-y-3">
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
                  Constance
                </Link>
              </li>
              <li className="pt-2">
                <Link 
                  href="/catalogo" 
                  onClick={onClose}
                  className="text-sm text-[#E85A9A] hover:text-[#EC5C9F] font-medium transition-colors block"
                >
                  Ver todo Hermès →
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Otras marcas */}
          <div>
            <h3 className="text-xs tracking-[0.3em] uppercase text-[#0B0B0B] font-semibold mb-6">
              Otras Marcas
            </h3>
            <ul className="space-y-3">
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
                  Ver todas →
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 4: Categorías */}
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
        </div>
      </div>
    </div>
  );
}

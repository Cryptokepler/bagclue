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
      className="absolute top-full left-1/2 -translate-x-1/2 bg-[#FFFBF8] border border-[#E85A9A]/[0.18] z-[60]"
      style={{
        width: 'min(1120px, calc(100vw - 48px))',
        minHeight: '320px',
        padding: '40px 48px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.12)',
      }}
    >
      <div className="grid grid-cols-4 gap-12 items-start">
        {/* Columna 1: Diseñadores */}
        <div className="min-w-0">
          <h3 className="text-xs tracking-[0.22em] uppercase text-[#0B0B0B] font-semibold mb-5 whitespace-nowrap">
            Diseñadores
          </h3>
          <ul className="space-y-3.5">
            <li>
              <Link 
                href="/catalogo" 
                onClick={onClose}
                className="text-[15px] text-[#4B5563] hover:text-[#E85A9A] transition-colors block whitespace-nowrap"
              >
                Chanel
              </Link>
            </li>
            <li>
              <Link 
                href="/catalogo" 
                onClick={onClose}
                className="text-[15px] text-[#4B5563] hover:text-[#E85A9A] transition-colors block whitespace-nowrap"
              >
                Hermès
              </Link>
            </li>
            <li>
              <Link 
                href="/catalogo" 
                onClick={onClose}
                className="text-[15px] text-[#4B5563] hover:text-[#E85A9A] transition-colors block whitespace-nowrap"
              >
                Louis Vuitton
              </Link>
            </li>
            <li>
              <Link 
                href="/catalogo" 
                onClick={onClose}
                className="text-[15px] text-[#4B5563] hover:text-[#E85A9A] transition-colors block whitespace-nowrap"
              >
                Dior
              </Link>
            </li>
            <li>
              <Link 
                href="/catalogo" 
                onClick={onClose}
                className="text-[15px] text-[#4B5563] hover:text-[#E85A9A] transition-colors block whitespace-nowrap"
              >
                Goyard
              </Link>
            </li>
            <li className="pt-4">
              <Link 
                href="/catalogo" 
                onClick={onClose}
                className="text-[15px] text-[#E85A9A] hover:text-[#EC5C9F] font-medium transition-colors block whitespace-nowrap"
              >
                Ver todos →
              </Link>
            </li>
          </ul>
        </div>

        {/* Columna 2: Categorías */}
        <div className="min-w-0">
          <h3 className="text-xs tracking-[0.22em] uppercase text-[#0B0B0B] font-semibold mb-5 whitespace-nowrap">
            Categorías
          </h3>
          <ul className="space-y-3.5">
            <li>
              <Link 
                href="/catalogo" 
                onClick={onClose}
                className="text-[15px] text-[#4B5563] hover:text-[#E85A9A] transition-colors block whitespace-nowrap"
              >
                Bolsas
              </Link>
            </li>
            <li>
              <Link 
                href="/catalogo" 
                onClick={onClose}
                className="text-[15px] text-[#4B5563] hover:text-[#E85A9A] transition-colors block whitespace-nowrap"
              >
                Zapatos
              </Link>
            </li>
            <li>
              <Link 
                href="/catalogo" 
                onClick={onClose}
                className="text-[15px] text-[#4B5563] hover:text-[#E85A9A] transition-colors block whitespace-nowrap"
              >
                Joyería
              </Link>
            </li>
            <li>
              <Link 
                href="/catalogo" 
                onClick={onClose}
                className="text-[15px] text-[#4B5563] hover:text-[#E85A9A] transition-colors block whitespace-nowrap"
              >
                Accesorios
              </Link>
            </li>
            <li>
              <Link 
                href="/catalogo" 
                onClick={onClose}
                className="text-[15px] text-[#4B5563] hover:text-[#E85A9A] transition-colors inline-flex items-center gap-2 whitespace-nowrap"
              >
                Recién llegadas
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] tracking-wider uppercase bg-[#FFF4A8] text-[#0B0B0B] font-medium">
                  New
                </span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Columna 3: Modelos */}
        <div className="min-w-0">
          <h3 className="text-xs tracking-[0.22em] uppercase text-[#0B0B0B] font-semibold mb-5 whitespace-nowrap">
            Modelos
          </h3>
          <ul className="space-y-3.5">
            <li>
              <Link 
                href="/catalogo" 
                onClick={onClose}
                className="text-[15px] text-[#4B5563] hover:text-[#E85A9A] transition-colors block whitespace-nowrap"
              >
                Classic Flap
              </Link>
            </li>
            <li>
              <Link 
                href="/catalogo" 
                onClick={onClose}
                className="text-[15px] text-[#4B5563] hover:text-[#E85A9A] transition-colors block whitespace-nowrap"
              >
                Chanel 25
              </Link>
            </li>
            <li>
              <Link 
                href="/catalogo" 
                onClick={onClose}
                className="text-[15px] text-[#4B5563] hover:text-[#E85A9A] transition-colors block whitespace-nowrap"
              >
                Birkin
              </Link>
            </li>
            <li>
              <Link 
                href="/catalogo" 
                onClick={onClose}
                className="text-[15px] text-[#4B5563] hover:text-[#E85A9A] transition-colors block whitespace-nowrap"
              >
                Kelly
              </Link>
            </li>
            <li>
              <Link 
                href="/catalogo" 
                onClick={onClose}
                className="text-[15px] text-[#4B5563] hover:text-[#E85A9A] transition-colors block whitespace-nowrap"
              >
                Wallet on Chain
              </Link>
            </li>
          </ul>
        </div>

        {/* Columna 4: Bagclue */}
        <div className="min-w-0">
          <h3 className="text-xs tracking-[0.22em] uppercase text-[#0B0B0B] font-semibold mb-5 whitespace-nowrap">
            Bagclue
          </h3>
          <ul className="space-y-3.5">
            <li className="text-[15px] text-[#4B5563] whitespace-nowrap">
              Piezas verificadas
            </li>
            <li className="text-[15px] text-[#4B5563] whitespace-nowrap">
              Aparta con pagos semanales
            </li>
            <li className="text-[15px] text-[#4B5563] whitespace-nowrap">
              Envíos seguros
            </li>
            <li className="pt-4">
              <a 
                href="https://ig.me/m/salebybagcluemx" 
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="text-[15px] text-[#E85A9A] hover:text-[#EC5C9F] font-medium transition-colors block whitespace-nowrap"
              >
                Hablar con Bagclue →
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

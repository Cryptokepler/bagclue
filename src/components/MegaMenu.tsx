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
      className="fixed left-1/2 -translate-x-1/2 bg-[#FFFBF8] border border-[#E85A9A]/[0.18] z-[80] hidden lg:block"
      style={{
        top: '134px',
        width: 'min(1120px, calc(100vw - 64px))',
        maxWidth: '1120px',
        minHeight: '300px',
        maxHeight: 'calc(100vh - 160px)',
        padding: '40px 48px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.12)',
        overflowY: 'auto',
      }}
    >
      <div 
        className="grid items-start"
        style={{
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: '56px',
        }}
      >
        {/* Columna 1: DISEÑADORES */}
        <div style={{ minWidth: 0, overflow: 'visible' }}>
          <h3 
            className="uppercase text-[#0B0B0B] font-semibold whitespace-nowrap"
            style={{
              fontSize: '12px',
              letterSpacing: '0.22em',
              marginBottom: '20px',
            }}
          >
            DISEÑADORES
          </h3>
          <ul>
            <li style={{ marginBottom: '12px' }}>
              <Link 
                href="/catalogo" 
                onClick={onClose}
                className="block text-[#4B5563] hover:text-[#E85A9A] transition-colors whitespace-nowrap"
                style={{ fontSize: '16px', lineHeight: '1.6' }}
              >
                Chanel
              </Link>
            </li>
            <li style={{ marginBottom: '12px' }}>
              <Link 
                href="/catalogo" 
                onClick={onClose}
                className="block text-[#4B5563] hover:text-[#E85A9A] transition-colors whitespace-nowrap"
                style={{ fontSize: '16px', lineHeight: '1.6' }}
              >
                Hermès
              </Link>
            </li>
            <li style={{ marginBottom: '12px' }}>
              <Link 
                href="/catalogo" 
                onClick={onClose}
                className="block text-[#4B5563] hover:text-[#E85A9A] transition-colors whitespace-nowrap"
                style={{ fontSize: '16px', lineHeight: '1.6' }}
              >
                Louis Vuitton
              </Link>
            </li>
            <li style={{ marginBottom: '12px' }}>
              <Link 
                href="/catalogo" 
                onClick={onClose}
                className="block text-[#4B5563] hover:text-[#E85A9A] transition-colors whitespace-nowrap"
                style={{ fontSize: '16px', lineHeight: '1.6' }}
              >
                Dior
              </Link>
            </li>
            <li style={{ marginBottom: '12px' }}>
              <Link 
                href="/catalogo" 
                onClick={onClose}
                className="block text-[#4B5563] hover:text-[#E85A9A] transition-colors whitespace-nowrap"
                style={{ fontSize: '16px', lineHeight: '1.6' }}
              >
                Goyard
              </Link>
            </li>
            <li>
              <Link 
                href="/catalogo" 
                onClick={onClose}
                className="block text-[#E85A9A] hover:text-[#EC5C9F] font-medium transition-colors whitespace-nowrap"
                style={{ fontSize: '16px', lineHeight: '1.6' }}
              >
                Ver todos →
              </Link>
            </li>
          </ul>
        </div>

        {/* Columna 2: CATEGORÍAS */}
        <div style={{ minWidth: 0, overflow: 'visible' }}>
          <h3 
            className="uppercase text-[#0B0B0B] font-semibold whitespace-nowrap"
            style={{
              fontSize: '12px',
              letterSpacing: '0.22em',
              marginBottom: '20px',
            }}
          >
            CATEGORÍAS
          </h3>
          <ul>
            <li style={{ marginBottom: '12px' }}>
              <Link 
                href="/catalogo" 
                onClick={onClose}
                className="block text-[#4B5563] hover:text-[#E85A9A] transition-colors whitespace-nowrap"
                style={{ fontSize: '16px', lineHeight: '1.6' }}
              >
                Bolsas de Mano
              </Link>
            </li>
            <li style={{ marginBottom: '12px' }}>
              <Link 
                href="/catalogo" 
                onClick={onClose}
                className="block text-[#4B5563] hover:text-[#E85A9A] transition-colors whitespace-nowrap"
                style={{ fontSize: '16px', lineHeight: '1.6' }}
              >
                Zapatos
              </Link>
            </li>
            <li style={{ marginBottom: '12px' }}>
              <Link 
                href="/catalogo" 
                onClick={onClose}
                className="block text-[#4B5563] hover:text-[#E85A9A] transition-colors whitespace-nowrap"
                style={{ fontSize: '16px', lineHeight: '1.6' }}
              >
                Joyería
              </Link>
            </li>
            <li style={{ marginBottom: '12px' }}>
              <Link 
                href="/catalogo" 
                onClick={onClose}
                className="block text-[#4B5563] hover:text-[#E85A9A] transition-colors whitespace-nowrap"
                style={{ fontSize: '16px', lineHeight: '1.6' }}
              >
                Accesorios
              </Link>
            </li>
            <li>
              <Link 
                href="/catalogo" 
                onClick={onClose}
                className="inline-flex items-center gap-2 text-[#4B5563] hover:text-[#E85A9A] transition-colors whitespace-nowrap"
                style={{ fontSize: '16px', lineHeight: '1.6' }}
              >
                Recién llegadas
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] tracking-wider uppercase bg-[#FFF4A8] text-[#0B0B0B] font-medium">
                  New
                </span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Columna 3: MODELOS */}
        <div style={{ minWidth: 0, overflow: 'visible' }}>
          <h3 
            className="uppercase text-[#0B0B0B] font-semibold whitespace-nowrap"
            style={{
              fontSize: '12px',
              letterSpacing: '0.22em',
              marginBottom: '20px',
            }}
          >
            MODELOS
          </h3>
          <ul>
            <li style={{ marginBottom: '12px' }}>
              <Link 
                href="/catalogo" 
                onClick={onClose}
                className="block text-[#4B5563] hover:text-[#E85A9A] transition-colors whitespace-nowrap"
                style={{ fontSize: '16px', lineHeight: '1.6' }}
              >
                Classic Flap
              </Link>
            </li>
            <li style={{ marginBottom: '12px' }}>
              <Link 
                href="/catalogo" 
                onClick={onClose}
                className="block text-[#4B5563] hover:text-[#E85A9A] transition-colors whitespace-nowrap"
                style={{ fontSize: '16px', lineHeight: '1.6' }}
              >
                Chanel 25
              </Link>
            </li>
            <li style={{ marginBottom: '12px' }}>
              <Link 
                href="/catalogo" 
                onClick={onClose}
                className="block text-[#4B5563] hover:text-[#E85A9A] transition-colors whitespace-nowrap"
                style={{ fontSize: '16px', lineHeight: '1.6' }}
              >
                Birkin
              </Link>
            </li>
            <li style={{ marginBottom: '12px' }}>
              <Link 
                href="/catalogo" 
                onClick={onClose}
                className="block text-[#4B5563] hover:text-[#E85A9A] transition-colors whitespace-nowrap"
                style={{ fontSize: '16px', lineHeight: '1.6' }}
              >
                Kelly
              </Link>
            </li>
            <li>
              <Link 
                href="/catalogo" 
                onClick={onClose}
                className="block text-[#4B5563] hover:text-[#E85A9A] transition-colors whitespace-nowrap"
                style={{ fontSize: '16px', lineHeight: '1.6' }}
              >
                Wallet on Chain
              </Link>
            </li>
          </ul>
        </div>

        {/* Columna 4: BAGCLUE */}
        <div style={{ minWidth: 0, overflow: 'visible' }}>
          <h3 
            className="uppercase text-[#0B0B0B] font-semibold whitespace-nowrap"
            style={{
              fontSize: '12px',
              letterSpacing: '0.22em',
              marginBottom: '20px',
            }}
          >
            BAGCLUE
          </h3>
          <ul>
            <li 
              className="text-[#4B5563] whitespace-nowrap"
              style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '12px' }}
            >
              Piezas verificadas
            </li>
            <li 
              className="text-[#4B5563] whitespace-nowrap"
              style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '12px' }}
            >
              Aparta con pagos semanales
            </li>
            <li 
              className="text-[#4B5563] whitespace-nowrap"
              style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '12px' }}
            >
              Envíos seguros
            </li>
            <li>
              <a 
                href="https://ig.me/m/salebybagcluemx" 
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="block text-[#E85A9A] hover:text-[#EC5C9F] font-medium transition-colors whitespace-nowrap"
                style={{ fontSize: '16px', lineHeight: '1.6' }}
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

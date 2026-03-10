'use client';

import { useState } from 'react';
import ProductCard from '@/components/ProductCard';
import { products, Brand, ProductStatus } from '@/data/products';

const brands: Brand[] = ['Chanel', 'Hermès', 'Goyard', 'Céline', 'Louis Vuitton', 'Balenciaga'];
const statuses: ProductStatus[] = ['En inventario', 'Pre-venta', 'Apartada'];

export default function CatalogoPage() {
  const [brandFilter, setBrandFilter] = useState<Brand | ''>('');
  const [statusFilter, setStatusFilter] = useState<ProductStatus | ''>('');

  const filtered = products.filter(p => {
    if (brandFilter && p.brand !== brandFilter) return false;
    if (statusFilter && p.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="pt-28 pb-24">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-xs tracking-[0.5em] uppercase text-[#FF69B4]/60">Colección</span>
          <h1 className="font-[family-name:var(--font-playfair)] text-4xl md:text-5xl text-gray-900 mt-3">Catálogo</h1>
          <p className="text-sm text-gray-900/40 mt-4">Todas nuestras piezas con autenticidad verificada por Entrupy</p>
          <div className="w-16 h-px bg-[#FF69B4]/30 mx-auto mt-6" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-12 justify-center">
          <select
            value={brandFilter}
            onChange={e => setBrandFilter(e.target.value as Brand | '')}
            className="bg-[#111] border border-[#FF69B4]/20 text-gray-900 text-sm px-4 py-2.5 focus:border-[#FF69B4] outline-none"
          >
            <option value="">Todas las marcas</option>
            {brands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as ProductStatus | '')}
            className="bg-[#111] border border-[#FF69B4]/20 text-gray-900 text-sm px-4 py-2.5 focus:border-[#FF69B4] outline-none"
          >
            <option value="">Todos los estados</option>
            {statuses.map(s => <option key={s} value={s}>{s === 'En inventario' ? 'Disponible' : s}</option>)}
          </select>
          {(brandFilter || statusFilter) && (
            <button onClick={() => { setBrandFilter(''); setStatusFilter(''); }} className="text-xs tracking-widest uppercase text-[#FF69B4] border border-[#FF69B4]/20 px-4 py-2.5 hover:bg-[#FF69B4] hover:text-gray-900 transition-all">
              Limpiar filtros
            </button>
          )}
        </div>

        <p className="text-xs text-gray-900/30 text-center mb-8">{filtered.length} pieza{filtered.length !== 1 ? 's' : ''}</p>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(p => <ProductCard key={p.id} product={p} />)}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-24">
            <p className="text-gray-900/40">No se encontraron piezas con estos filtros.</p>
          </div>
        )}
      </div>
    </div>
  );
}

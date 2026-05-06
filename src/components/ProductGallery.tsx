'use client';

import { useState } from 'react';

interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  position: number;
}

interface ProductGalleryProps {
  images: ProductImage[];
  gradient: { from: string; to: string };
  brand: string;
  title: string;
  status: string;
  badge: string | null;
}

export default function ProductGallery({ images, gradient, brand, title, status, badge }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const currentImage = images[activeIndex]?.url || '';

  return (
    <div>
      {/* Imagen principal */}
      <div
        className="aspect-[3/4] relative overflow-hidden border border-[#E85A9A]/10 mb-4"
        style={{ background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` }}
      >
        {currentImage ? (
          <img
            src={currentImage}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-[family-name:var(--font-playfair)] text-5xl text-[#0B0B0B]/10 tracking-widest">{brand}</span>
            <span className="text-sm text-[#0B0B0B]/20 mt-4 tracking-wider">Imagen próximamente</span>
          </div>
        )}

        {/* Badges (máximo 2-3) */}
        {status !== 'available' && (
          <div className="absolute top-4 left-4">
            <span className={`text-xs tracking-wider uppercase px-3 py-1.5 rounded ${
              status === 'sold' ? 'bg-gray-200 text-gray-600 border border-gray-300' :
              status === 'reserved' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
              status === 'preorder' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
              'bg-gray-100 text-gray-600'
            }`}>
              {status === 'sold' && 'Vendida'}
              {status === 'reserved' && 'Apartada'}
              {status === 'preorder' && 'Pre-venta'}
            </span>
          </div>
        )}

        <div className="absolute top-4 right-4">
          <span className="text-[10px] tracking-wider bg-emerald-100 text-emerald-600 px-2.5 py-1.5 border border-emerald-200 rounded">
            ✓ Verificada
          </span>
        </div>

        {badge && (
          <div className="absolute bottom-4 left-4">
            <span className="text-[10px] tracking-wider uppercase px-2.5 py-1.5 bg-[#E85A9A]/10 text-[#E85A9A] border border-[#E85A9A]/30 rounded">
              {badge}
            </span>
          </div>
        )}
      </div>

      {/* Thumbnails (si hay múltiples imágenes) */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto">
          {images.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => setActiveIndex(idx)}
              className={`flex-shrink-0 w-20 h-20 border-2 transition-all duration-200 ${
                idx === activeIndex ? 'border-[#E85A9A]' : 'border-gray-200 hover:border-[#E85A9A]/50'
              }`}
            >
              <img
                src={img.url}
                alt={`Vista ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

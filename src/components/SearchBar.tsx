'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (query.trim()) {
      // Redirigir a catálogo con query param
      router.push(`/catalogo?search=${encodeURIComponent(query.trim())}`);
    } else {
      // Si vacío, redirigir a catálogo sin búsqueda
      router.push('/catalogo');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Busca por marca, modelo o pieza…"
          className="flex-1 bg-white border border-[#E85A9A]/20 text-[#0B0B0B] px-6 py-4 text-base focus:border-[#E85A9A] focus:outline-none focus:ring-2 focus:ring-[#E85A9A]/20 transition-all rounded-full"
          aria-label="Buscar productos"
        />
        <button
          type="submit"
          className="font-[family-name:var(--font-inter)] bg-[#E85A9A] text-white px-10 py-4 text-sm tracking-wide uppercase font-semibold hover:bg-[#EC5C9F] transition-all duration-300 rounded-full shadow-md hover:shadow-lg"
        >
          Buscar
        </button>
      </form>
    </div>
  );
}

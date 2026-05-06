'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { supabase } from '@/lib/supabase';
import { Product, dbStatusToLegacy } from '@/types/database';
import type { Brand, ProductStatus, Product as LegacyProduct } from '@/data/products';
import { PRODUCT_PUBLIC_FIELDS } from '@/lib/products-public-fields';

const brands = ['Chanel', 'Hermès', 'Goyard', 'Céline', 'Louis Vuitton', 'Balenciaga', 'Dior'] as const;
const statuses: ProductStatus[] = ['En inventario', 'Pre-venta', 'Apartada'];
const categories = ['Bolsas', 'Zapatos', 'Joyería', 'Accesorios'];

function CatalogoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [products, setProducts] = useState<LegacyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize filters from URL params
  const [brandFilter, setBrandFilter] = useState<string>(searchParams.get('brand') || '');
  const [statusFilter, setStatusFilter] = useState<ProductStatus | ''>(searchParams.get('status') as ProductStatus || '');
  const [categoryFilter, setCategoryFilter] = useState<string>(searchParams.get('category') || '');
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState<string>(searchParams.get('sort') || '');
  const [authFilter, setAuthFilter] = useState<boolean>(searchParams.get('auth') === 'verified');
  const [layawayFilter, setLayawayFilter] = useState<boolean>(searchParams.get('layaway') === 'true');

  // Sync states from URL params when they change (critical for navigation)
  useEffect(() => {
    setBrandFilter(searchParams.get('brand') || '');
    setStatusFilter(searchParams.get('status') as ProductStatus || '');
    setCategoryFilter(searchParams.get('category') || '');
    setSearchQuery(searchParams.get('search') || '');
    setSortBy(searchParams.get('sort') || '');
    setAuthFilter(searchParams.get('auth') === 'verified');
    setLayawayFilter(searchParams.get('layaway') === 'true');
  }, [searchParams]);

  // Sync filters with URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (brandFilter) params.set('brand', brandFilter);
    if (statusFilter) params.set('status', statusFilter);
    if (categoryFilter) params.set('category', categoryFilter);
    if (searchQuery) params.set('search', searchQuery);
    if (sortBy) params.set('sort', sortBy);
    if (authFilter) params.set('auth', 'verified');
    if (layawayFilter) params.set('layaway', 'true');
    
    const queryString = params.toString();
    const newUrl = queryString ? `/catalogo?${queryString}` : '/catalogo';
    router.replace(newUrl, { scroll: false });
  }, [brandFilter, statusFilter, categoryFilter, searchQuery, sortBy, authFilter, layawayFilter, router]);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        setError(null);

        // Fetch products with images and all necessary fields
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select(`${PRODUCT_PUBLIC_FIELDS}, product_images(*), authenticity_verified, allow_layaway`)
          .eq('is_published', true)
          .order('created_at', { ascending: false });

        if (productsError) throw productsError;

        // Transform DB products to legacy format for compatibility
        const transformedProducts: LegacyProduct[] = (productsData || []).map((p: any) => ({
          id: p.slug || p.id,
          slug: p.slug || undefined,
          brand: p.brand as Brand,
          model: p.model || p.title,
          color: p.color || '',
          origin: p.origin || '',
          status: dbStatusToLegacy(p.status),
          price: p.price,
          category: p.category as any,
          image: p.product_images?.[0]?.url || '',
          badge: p.badge || undefined,
          description: p.description || undefined,
          authenticity_verified: p.authenticity_verified,
          allow_layaway: p.allow_layaway
        }));

        setProducts(transformedProducts);
      } catch (err: any) {
        console.error('Error fetching products:', err);
        setError(err.message || 'Error al cargar productos');
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  const filtered = products
    .filter(p => {
      // Brand filter
      if (brandFilter && p.brand !== brandFilter) return false;
      
      // Status filter
      if (statusFilter && p.status !== statusFilter) return false;
      
      // Category filter
      if (categoryFilter && p.category !== categoryFilter) return false;
      
      // Search filter (search in title, brand, model, description)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const searchable = [
          p.model,
          p.brand,
          p.description || '',
          p.color || ''
        ].join(' ').toLowerCase();
        if (!searchable.includes(query)) return false;
      }
      
      // Auth filter (authenticity_verified)
      if (authFilter && !(p as any).authenticity_verified) return false;
      
      // Layaway filter (allow_layaway)
      if (layawayFilter && !(p as any).allow_layaway) return false;
      
      return true;
    })
    .sort((a, b) => {
      // Sort by newest
      if (sortBy === 'newest') {
        // Products are already sorted by created_at desc from DB
        return 0;
      }
      return 0;
    });

  if (loading) {
    return (
      <div className="pt-28 pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center py-24">
            <p className="text-gray-900/40">Cargando catálogo...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-28 pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center py-24">
            <p className="text-red-500/70">Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-28 pb-24">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="font-[family-name:var(--font-inter)] text-xs tracking-[0.5em] uppercase text-[#E85A9A]/60">Colección</span>
          <h1 className="font-[family-name:var(--font-playfair)] text-4xl md:text-5xl text-gray-900 mt-3 leading-tight tracking-tight">Catálogo</h1>
          <p className="font-[family-name:var(--font-inter)] text-sm text-gray-900/40 mt-4">Todas nuestras piezas con autenticidad verificada por Entrupy</p>
          <div className="w-16 h-px bg-[#E85A9A]/30 mx-auto mt-6" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8 justify-center">
          {/* Search */}
          <input
            type="text"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="font-[family-name:var(--font-inter)] bg-white border-2 border-[#E85A9A]/30 text-[#0B0B0B] text-sm px-4 py-2.5 focus:border-[#E85A9A] outline-none rounded-lg min-w-[200px]"
          />
          
          {/* Brand */}
          <select
            value={brandFilter}
            onChange={e => setBrandFilter(e.target.value)}
            className="font-[family-name:var(--font-inter)] bg-white border-2 border-[#E85A9A]/30 text-[#0B0B0B] text-sm px-4 py-2.5 focus:border-[#E85A9A] outline-none rounded-lg"
          >
            <option value="">Todas las marcas</option>
            {brands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          
          {/* Category */}
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="font-[family-name:var(--font-inter)] bg-white border-2 border-[#E85A9A]/30 text-[#0B0B0B] text-sm px-4 py-2.5 focus:border-[#E85A9A] outline-none rounded-lg"
          >
            <option value="">Todas las categorías</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          
          {/* Status */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as ProductStatus | '')}
            className="font-[family-name:var(--font-inter)] bg-white border-2 border-[#E85A9A]/30 text-[#0B0B0B] text-sm px-4 py-2.5 focus:border-[#E85A9A] outline-none rounded-lg"
          >
            <option value="">Todos los estados</option>
            {statuses.map(s => <option key={s} value={s}>{s === 'En inventario' ? 'Disponible' : s}</option>)}
          </select>
          
          {/* Sort */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="font-[family-name:var(--font-inter)] bg-white border-2 border-[#E85A9A]/30 text-[#0B0B0B] text-sm px-4 py-2.5 focus:border-[#E85A9A] outline-none rounded-lg"
          >
            <option value="">Ordenar por</option>
            <option value="newest">Más recientes</option>
          </select>
        </div>
        
        {/* Special filters */}
        <div className="flex flex-wrap gap-3 mb-8 justify-center">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={authFilter}
              onChange={e => setAuthFilter(e.target.checked)}
              className="w-4 h-4 text-[#E85A9A] border-[#E85A9A]/30 rounded focus:ring-[#E85A9A]"
            />
            <span className="font-[family-name:var(--font-inter)] text-sm text-gray-600">Solo verificadas</span>
          </label>
          
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={layawayFilter}
              onChange={e => setLayawayFilter(e.target.checked)}
              className="w-4 h-4 text-[#E85A9A] border-[#E85A9A]/30 rounded focus:ring-[#E85A9A]"
            />
            <span className="font-[family-name:var(--font-inter)] text-sm text-gray-600">Apartado disponible</span>
          </label>
          
          {(brandFilter || statusFilter || categoryFilter || searchQuery || sortBy || authFilter || layawayFilter) && (
            <button 
              onClick={() => { 
                setBrandFilter(''); 
                setStatusFilter(''); 
                setCategoryFilter('');
                setSearchQuery('');
                setSortBy('');
                setAuthFilter(false);
                setLayawayFilter(false);
              }} 
              className="text-xs tracking-widest uppercase text-[#E85A9A] border-2 border-[#E85A9A]/30 px-4 py-2 hover:bg-[#E85A9A] hover:text-white transition-all rounded-lg"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        <p className="text-xs text-gray-900/30 text-center mb-8">{filtered.length} pieza{filtered.length !== 1 ? 's' : ''}</p>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(p => <ProductCard key={p.id} product={p} />)}
        </div>

        {filtered.length === 0 && !loading && (
          <div className="text-center py-24">
            <div className="max-w-md mx-auto">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="font-[family-name:var(--font-playfair)] text-2xl text-gray-900 mb-3">
                No encontramos piezas con estos filtros
              </h3>
              <p className="text-sm text-gray-900/40 mb-8">
                Prueba ajustando los filtros o explora todo nuestro catálogo
              </p>
              <button
                onClick={() => {
                  setBrandFilter('');
                  setStatusFilter('');
                  setCategoryFilter('');
                  setSearchQuery('');
                  setSortBy('');
                  setAuthFilter(false);
                  setLayawayFilter(false);
                }}
                className="inline-flex items-center gap-2 bg-[#E85A9A] text-white px-8 py-3 text-sm tracking-widest uppercase font-medium hover:bg-[#EC5C9F] transition-colors rounded-lg"
              >
                Ver todo el catálogo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CatalogoPage() {
  return (
    <Suspense fallback={
      <div className="pt-28 pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center py-24">
            <p className="text-gray-900/40">Cargando catálogo...</p>
          </div>
        </div>
      </div>
    }>
      <CatalogoContent />
    </Suspense>
  );
}

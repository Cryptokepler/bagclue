import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { PRODUCT_PUBLIC_FIELDS } from '@/lib/products-public-fields'

async function getNewArrivals() {
  const { data: productsData, error } = await supabase
    .from('products')
    .select(`${PRODUCT_PUBLIC_FIELDS}, product_images(*)`)
    .eq('is_published', true)
    .eq('status', 'available')
    .order('created_at', { ascending: false })
    .limit(6)

  if (error) {
    console.error('Error fetching new arrivals:', error)
    return []
  }

  return (productsData || []).map((p: any) => ({
    id: p.id,
    slug: p.slug,
    brand: p.brand,
    title: p.title,
    price: p.price,
    currency: p.currency || 'MXN',
    image: p.product_images?.[0]?.url || ''
  }))
}

export default async function NewArrivals() {
  const products = await getNewArrivals()

  if (products.length === 0) {
    return (
      <section className="bg-[#FFFBF8] py-16 md:py-24 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-[#3A3431] font-[family-name:var(--font-cormorant)] font-medium text-3xl md:text-4xl mb-4">
            New Arrivals
          </h2>
          <p className="text-[#2D2420] font-[family-name:var(--font-manrope)] text-base">
            Próximamente nuevas piezas
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-[#FFFBF8] py-16 md:py-24 px-6 md:px-10">
      <div className="max-w-7xl mx-auto">
        {/* Headline */}
        <h2 className="text-[#3A3431] font-[family-name:var(--font-cormorant)] font-medium text-3xl md:text-4xl text-center mb-12 md:mb-16">
          Recién llegados
        </h2>
        
        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-x-12 md:gap-y-16">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/catalogo/${product.slug}`}
              className="group block"
            >
              {/* Imagen */}
              <div className="relative aspect-[3/4] rounded overflow-hidden mb-4">
                <Image
                  src={product.image}
                  alt={`${product.brand} ${product.title}`}
                  fill
                  className="object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-[1.03]"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              
              {/* Brand */}
              <p className="text-[#9B8F87] font-[family-name:var(--font-manrope)] text-[11px] font-medium tracking-[0.1em] uppercase mb-2">
                {product.brand}
              </p>
              
              {/* Title */}
              <h3 className="text-[#3A3431] font-[family-name:var(--font-cormorant)] font-medium text-xl leading-[1.3] mb-2">
                {product.title}
              </h3>
              
              {/* Price */}
              <p className="text-[#8B4852] font-[family-name:var(--font-manrope)] text-base font-semibold">
                ${product.price?.toLocaleString('es-MX')} {product.currency}
              </p>
            </Link>
          ))}
        </div>
        
        {/* Link Ver colección */}
        <div className="text-center mt-12 md:mt-16">
          <Link
            href="/catalogo"
            className="inline-block text-[#8B4852] font-[family-name:var(--font-manrope)] text-[15px] font-medium hover:text-[#E85A9A] hover:underline transition-all duration-300"
          >
            Ver colección completa →
          </Link>
        </div>
      </div>
    </section>
  )
}

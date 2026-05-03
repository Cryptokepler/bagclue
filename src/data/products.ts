export type ProductStatus = 'En inventario' | 'Pre-venta' | 'Apartada';

export type Brand = 'Chanel' | 'Hermès' | 'Goyard' | 'Céline' | 'Louis Vuitton' | 'Balenciaga';

export type ProductCategory = 'Bolsas' | 'Accesorios' | 'Colección París';

export interface Product {
  id: string;
  brand: Brand;
  model: string;
  color: string;
  origin: string;
  status: ProductStatus;
  price: number | null; // null = "Consultar precio"
  category: ProductCategory;
  image?: string;
  badge?: string;
  description?: string;
}

export const brandGradients: Record<Brand, { from: string; to: string }> = {
  'Chanel': { from: '#1a1a1a', to: '#C9A96E' },
  'Hermès': { from: '#C46A10', to: '#5C2D0A' },
  'Goyard': { from: '#2D4A2D', to: '#D4C9A8' },
  'Céline': { from: '#3A3A3A', to: '#B8A88A' },
  'Louis Vuitton': { from: '#4A3520', to: '#C9A96E' },
  'Balenciaga': { from: '#1a1a1a', to: '#4A4A4A' },
};

export const products: Product[] = [
  // En inventario
  { id: 'B010', brand: 'Chanel', model: '25 Mezclilla Small', color: 'Mezclilla', origin: 'México', status: 'En inventario', price: null, category: 'Bolsas', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=800&fit=crop', badge: 'Últimas piezas', description: 'El denim más icónico de Chanel. Una pieza que fusiona lo casual con la alta costura — imposible de encontrar en tiendas.' },
  { id: 'B014', brand: 'Chanel', model: '25 Mediana', color: 'Café', origin: 'USA', status: 'En inventario', price: null, category: 'Bolsas', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&h=800&fit=crop&q=80', badge: 'Pieza única', description: 'El tono café más elegante del Classic Flap. Piel de cordero que envejece como el buen vino.' },
  { id: 'B015', brand: 'Chanel', model: '25 Mediana', color: 'Beige', origin: 'USA', status: 'En inventario', price: null, category: 'Bolsas', image: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=600&h=800&fit=crop', badge: 'Últimas piezas', description: 'El beige clásico que Karl Lagerfeld elevó a obra de arte. Elegancia atemporal para toda ocasión.' },
  { id: 'B018', brand: 'Chanel', model: '25 Small', color: 'Dorada', origin: 'USA', status: 'En inventario', price: null, category: 'Bolsas', image: 'https://images.unsplash.com/photo-1606522754091-a05f04f7b3fb?w=600&h=800&fit=crop', badge: 'Pieza única', description: 'Brillo dorado que convierte cualquier outfit en un evento. Edición que ya no se produce — oportunidad irrepetible.' },
  { id: 'B029', brand: 'Chanel', model: 'Lentes Gato', color: 'Lentes', origin: 'USA', status: 'En inventario', price: null, category: 'Accesorios', image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&h=800&fit=crop', badge: 'Últimas piezas', description: 'Los lentes cat-eye más deseados del mundo. Protección UV con actitud Chanel — el accesorio que completa todo.' },
  { id: 'B034', brand: 'Hermès', model: 'Kelly', color: 'Plateada', origin: 'USA', status: 'En inventario', price: 126000, category: 'Bolsas', image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&h=800&fit=crop', badge: 'Pieza única', description: 'La Kelly de Hermès — lista de espera de años en boutique. Esta pieza plateada es una inversión que se revaloriza cada temporada.' },
  { id: 'B035', brand: 'Chanel', model: 'WOC', color: 'Plata', origin: 'USA', status: 'En inventario', price: null, category: 'Bolsas', image: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=600&h=800&fit=crop', badge: 'Últimas piezas', description: 'Wallet on Chain en plateado: el clutch perfecto para la noche. Compacta, elegante y 100% Chanel.' },
  { id: 'B037', brand: 'Hermès', model: 'Gorro', color: 'Gorro', origin: 'USA', status: 'En inventario', price: null, category: 'Accesorios', image: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=600&h=800&fit=crop', badge: 'Pieza única', description: 'Cashmere Hermès para los días fríos con estilo. Un lujo discreto que se siente en cada fibra.' },
  { id: 'B038', brand: 'Hermès', model: 'Cinturón', color: 'Vino', origin: 'USA', status: 'En inventario', price: null, category: 'Accesorios', image: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=600&h=800&fit=crop', badge: 'Últimas piezas', description: 'El cinturón H que no necesita presentación. Tono vino que eleva cualquier look de básico a extraordinario.' },
  { id: 'B039', brand: 'Hermès', model: 'Constance', color: 'Azul', origin: 'USA', status: 'En inventario', price: null, category: 'Bolsas', image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&h=800&fit=crop&sat=-20&hue=220', badge: 'Pieza única', description: 'La Constance azul — tan exclusiva como la Birkin pero con personalidad propia. Casi imposible de conseguir en este color.' },
  { id: 'B042', brand: 'Chanel', model: '25 Mini', color: 'Negra', origin: 'USA', status: 'En inventario', price: null, category: 'Bolsas', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&h=800&fit=crop&q=80&bri=-10', badge: 'Últimas piezas', description: 'El mini flap negro — la pieza más versátil de Chanel. Del brunch a la cena sin cambiar de bolsa.' },
  { id: 'B043', brand: 'Chanel', model: '25 Small', color: 'Nude', origin: 'USA', status: 'En inventario', price: null, category: 'Bolsas', image: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=600&h=800&fit=crop&q=80&sat=-30', badge: 'Pieza única', description: 'El nude perfecto que combina con absolutamente todo. Piel de cordero suave como la seda — una joya para tu colección.' },
  { id: 'B045', brand: 'Chanel', model: '25 Mediana', color: 'Denim', origin: 'USA', status: 'En inventario', price: null, category: 'Bolsas', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=800&fit=crop&q=80', badge: 'Últimas piezas', description: 'Mezclilla + Chanel = la combinación más cool del momento. Una pieza que desaparece de los inventarios en horas.' },
  // Pre-venta — Colección París
  { id: 'B048', brand: 'Céline', model: 'Aretes', color: 'Dorados', origin: 'Francia', status: 'Pre-venta', price: 12600, category: 'Colección París', image: 'https://images.unsplash.com/photo-1606522754091-a05f04f7b3fb?w=600&h=800&fit=crop&q=80&sat=-10', badge: 'Edición limitada', description: 'Aretes Céline directo de París. Oro que enmarca tu rostro con la elegancia francesa más pura.' },
  { id: 'B049', brand: 'Goyard', model: 'Anjou', color: 'Café', origin: 'Francia', status: 'Pre-venta', price: 70200, category: 'Colección París', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=800&fit=crop&q=80&bri=-5', badge: 'Edición limitada', description: 'La Anjou de Goyard — reversible, artesanal, irrepetible. Hecha a mano en los talleres más exclusivos de París.' },
  { id: 'B050', brand: 'Goyard', model: 'Goyard', color: 'Burgundy', origin: 'Francia', status: 'Pre-venta', price: 72000, category: 'Colección París', image: 'https://images.unsplash.com/photo-1575032617751-6ddec2089882?w=600&h=800&fit=crop', badge: 'Edición limitada', description: 'Burgundy Goyard — el color de la realeza francesa. Una pieza que no encontrarás en ninguna tienda de México.' },
  { id: 'B052', brand: 'Goyard', model: 'St. Louis', color: 'Negra', origin: 'Francia', status: 'Pre-venta', price: 68400, category: 'Colección París', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&h=800&fit=crop', badge: 'Edición limitada', description: 'La St. Louis negra de Goyard — el tote más elegante del mundo. Ligera como una pluma, resistente como ninguna.' },
  { id: 'B055', brand: 'Goyard', model: 'Eye Candy', color: 'Vino', origin: 'Francia', status: 'Pre-venta', price: 77400, category: 'Colección París', image: 'https://images.unsplash.com/photo-1575032617751-6ddec2089882?w=600&h=800&fit=crop&q=80', badge: 'Edición limitada', description: 'Eye Candy en vino — dulce para la vista, letal para el estilo. Artesanía parisina en su máxima expresión.' },
  { id: 'B062', brand: 'Louis Vuitton', model: 'Neverfull', color: 'Ebene', origin: 'Francia', status: 'Pre-venta', price: 46800, category: 'Colección París', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=800&fit=crop&q=80&bri=-10', badge: 'Edición limitada', description: 'La Neverfull Damier Ebene — la bolsa que nunca pasa de moda. Capacidad infinita con el monograma más reconocido del mundo.' },
  { id: 'B063', brand: 'Balenciaga', model: 'WOC', color: 'Nude', origin: 'Francia', status: 'Pre-venta', price: 30600, category: 'Colección París', image: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=600&h=800&fit=crop&q=80', badge: 'Edición limitada', description: 'Balenciaga WOC nude — minimalismo parisino en su forma más pura. El accesorio perfecto para quien sabe de moda.' },
  { id: 'B064', brand: 'Balenciaga', model: 'WOC', color: 'Verde', origin: 'Francia', status: 'Pre-venta', price: 30600, category: 'Colección París', image: 'https://images.unsplash.com/photo-1559563458-527698bf5295?w=600&h=800&fit=crop', badge: 'Edición limitada', description: 'Verde Balenciaga — el color que domina las pasarelas esta temporada. Atrévete a destacar.' },
  { id: 'B065', brand: 'Chanel', model: '25 Mediana', color: 'Denim', origin: 'USA', status: 'Pre-venta', price: 179000, category: 'Colección París', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=800&fit=crop&q=80&sat=10', badge: 'Edición limitada', description: 'El Classic Flap denim que se agotó en minutos en boutique. Tu segunda oportunidad está aquí — no habrá tercera.' },
  // Apartada
  { id: 'B001', brand: 'Chanel', model: '25 Classic', color: 'Color vino', origin: 'USA', status: 'Apartada', price: 189000, category: 'Bolsas', image: 'https://images.unsplash.com/photo-1575032617751-6ddec2089882?w=600&h=800&fit=crop&q=80', description: 'El Classic Flap en color vino — sofisticación que habla sin palabras. Ya apartada por una conocedora.' },
];

export function formatPrice(price: number | null): string {
  if (price === null) return 'Consultar precio';
  return `$${price.toLocaleString('es-MX')} MXN`;
}

export function getStatusColor(status: ProductStatus): string {
  switch (status) {
    case 'En inventario': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'Pre-venta': return 'bg-[#C9A96E]/20 text-[#C9A96E] border-[#C9A96E]/30';
    case 'Apartada': return 'bg-[#D4A0A0]/20 text-[#D4A0A0] border-[#D4A0A0]/30';
  }
}

export function getStatusLabel(status: ProductStatus): string {
  switch (status) {
    case 'En inventario': return 'Disponible';
    case 'Pre-venta': return 'Pre-venta';
    case 'Apartada': return 'Apartada';
  }
}

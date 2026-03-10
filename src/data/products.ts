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
  { id: 'B010', brand: 'Chanel', model: '25 Mezclilla Small', color: 'Mezclilla', origin: 'México', status: 'En inventario', price: null, category: 'Bolsas' },
  { id: 'B014', brand: 'Chanel', model: '25 Mediana', color: 'Café', origin: 'USA', status: 'En inventario', price: null, category: 'Bolsas' },
  { id: 'B015', brand: 'Chanel', model: '25 Mediana', color: 'Beige', origin: 'USA', status: 'En inventario', price: null, category: 'Bolsas' },
  { id: 'B018', brand: 'Chanel', model: '25 Small', color: 'Dorada', origin: 'USA', status: 'En inventario', price: null, category: 'Bolsas' },
  { id: 'B029', brand: 'Chanel', model: 'Lentes Gato', color: 'Lentes', origin: 'USA', status: 'En inventario', price: null, category: 'Accesorios' },
  { id: 'B034', brand: 'Hermès', model: 'Kelly', color: 'Plateada', origin: 'USA', status: 'En inventario', price: 126000, category: 'Bolsas' },
  { id: 'B035', brand: 'Chanel', model: 'WOC', color: 'Plata', origin: 'USA', status: 'En inventario', price: null, category: 'Bolsas' },
  { id: 'B037', brand: 'Hermès', model: 'Gorro', color: 'Gorro', origin: 'USA', status: 'En inventario', price: null, category: 'Accesorios' },
  { id: 'B038', brand: 'Hermès', model: 'Cinturón', color: 'Vino', origin: 'USA', status: 'En inventario', price: null, category: 'Accesorios' },
  { id: 'B039', brand: 'Hermès', model: 'Constance', color: 'Azul', origin: 'USA', status: 'En inventario', price: null, category: 'Bolsas' },
  { id: 'B042', brand: 'Chanel', model: '25 Mini', color: 'Negra', origin: 'USA', status: 'En inventario', price: null, category: 'Bolsas' },
  { id: 'B043', brand: 'Chanel', model: '25 Small', color: 'Nude', origin: 'USA', status: 'En inventario', price: null, category: 'Bolsas' },
  { id: 'B045', brand: 'Chanel', model: '25 Mediana', color: 'Denim', origin: 'USA', status: 'En inventario', price: null, category: 'Bolsas' },
  // Pre-venta
  { id: 'B048', brand: 'Céline', model: 'Aretes', color: 'Dorados', origin: 'Francia', status: 'Pre-venta', price: 12600, category: 'Colección París' },
  { id: 'B049', brand: 'Goyard', model: 'Anjou', color: 'Café', origin: 'Francia', status: 'Pre-venta', price: 70200, category: 'Colección París' },
  { id: 'B050', brand: 'Goyard', model: 'Goyard', color: 'Burgundy', origin: 'Francia', status: 'Pre-venta', price: 72000, category: 'Colección París' },
  { id: 'B052', brand: 'Goyard', model: 'St. Louis', color: 'Negra', origin: 'Francia', status: 'Pre-venta', price: 68400, category: 'Colección París' },
  { id: 'B055', brand: 'Goyard', model: 'Eye Candy', color: 'Vino', origin: 'Francia', status: 'Pre-venta', price: 77400, category: 'Colección París' },
  { id: 'B062', brand: 'Louis Vuitton', model: 'Neverfull', color: 'Ebene', origin: 'Francia', status: 'Pre-venta', price: 46800, category: 'Colección París' },
  { id: 'B063', brand: 'Balenciaga', model: 'WOC', color: 'Nude', origin: 'Francia', status: 'Pre-venta', price: 30600, category: 'Colección París' },
  { id: 'B064', brand: 'Balenciaga', model: 'WOC', color: 'Verde', origin: 'Francia', status: 'Pre-venta', price: 30600, category: 'Colección París' },
  { id: 'B065', brand: 'Chanel', model: '25 Mediana', color: 'Denim', origin: 'USA', status: 'Pre-venta', price: 179000, category: 'Colección París' },
  // Apartada
  { id: 'B001', brand: 'Chanel', model: '25 Classic', color: 'Color vino', origin: 'USA', status: 'Apartada', price: 189000, category: 'Bolsas' },
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

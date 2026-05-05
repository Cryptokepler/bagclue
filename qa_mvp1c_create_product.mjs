import fetch from 'node-fetch';

const productData = {
  // Básicos
  title: 'QA Inventario MVP1C',
  brand: 'Chanel',
  model: 'Test Model',
  color: 'Negro',
  origin: 'Francia',
  material: 'Piel caviar',
  status: 'available',
  condition: 'excellent',
  category: 'Bolsas',
  price: 10000,
  currency: 'MXN',
  is_published: true,
  
  // Estado y condición
  condition_notes: 'Producto test QA. No usar para venta real.',
  
  // Autenticidad y accesorios
  authenticity_verified: true,
  certificate_notes: 'Certificado test Entrupy',
  serial_number: 'QA-SERIAL-001',
  included_accessories: 'Caja, dust bag, certificado test',
  includes_box: true,
  includes_dust_bag: true,
  includes_papers: true,
  
  // Información interna
  cost_price: 6000,
  additional_costs: {
    shipping: 500,
    authentication: 300,
    cleaning: 200,
    other: 100
  },
  supplier_name: 'Proveedor QA',
  acquisition_date: '2026-05-05',
  physical_location: 'Bodega QA A1',
  internal_notes: 'Producto test para QA MVP.1C'
};

console.log('=== CREANDO PRODUCTO TEST MVP.1C ===\n');
console.log('Datos a enviar:');
console.log(JSON.stringify(productData, null, 2));
console.log('\n--- Enviando request a API...\n');

try {
  const response = await fetch('https://bagclue.vercel.app/api/products/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Nota: Este endpoint requiere autenticación admin
      // Si falla por auth, necesitaremos usar session cookie
    },
    body: JSON.stringify(productData)
  });

  const result = await response.json();
  
  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(result, null, 2));
  
  if (response.ok && result.product) {
    console.log('\n✅ PRODUCTO CREADO');
    console.log('ID:', result.product.id);
    console.log('Slug:', result.product.slug);
    console.log('URL Admin:', `https://bagclue.vercel.app/admin/productos/${result.product.id}`);
    console.log('URL Pública:', `https://bagclue.vercel.app/catalogo/${result.product.slug}`);
    
    // Calcular rentabilidad
    const totalCost = 6000 + 500 + 300 + 200 + 100;
    const profit = 10000 - totalCost;
    const margin = (profit / 10000) * 100;
    
    console.log('\n💰 RENTABILIDAD');
    console.log('Costo total:', totalCost, 'MXN');
    console.log('Precio venta:', 10000, 'MXN');
    console.log('Utilidad:', profit, 'MXN');
    console.log('Margen:', margin.toFixed(2), '%');
    
  } else {
    console.log('\n❌ ERROR AL CREAR PRODUCTO');
    console.log('Detalles:', result);
  }
  
} catch (error) {
  console.error('\n❌ ERROR DE CONEXIÓN');
  console.error(error.message);
}

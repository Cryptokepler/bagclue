// QA: Create test product for bank transfer testing

const testProduct = {
  title: 'QA Bank Transfer Test',
  brand: 'Chanel',
  model: 'Test Model',
  color: 'Test',
  price: 20,
  currency: 'MXN',
  status: 'available',
  category: 'Bolsas',
  condition: 'new',
  stock: 1,
  is_published: true,
  description: 'Producto test para QA de transferencia bancaria. NO es producto real.',
  authenticity_verified: false,
  allow_layaway: false
}

async function createTestProduct() {
  try {
    const response = await fetch('http://localhost:3000/api/products/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'admin_session=test' // Will need real session
      },
      body: JSON.stringify(testProduct)
    })
    
    const data = await response.json()
    console.log('Response:', JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Error:', error.message)
  }
}

createTestProduct()

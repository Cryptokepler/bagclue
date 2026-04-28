import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authenticated = await isAuthenticated()
    if (!authenticated) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id: productId } = await params
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 })
    }

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'El archivo debe ser una imagen' }, { status: 400 })
    }

    // Generar nombre único
    const timestamp = Date.now()
    const ext = file.name.split('.').pop()
    const fileName = `${productId}/${timestamp}.${ext}`

    // Convertir File a Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Subir a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('product-images')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // Obtener URL pública
    const { data: urlData } = supabaseAdmin.storage
      .from('product-images')
      .getPublicUrl(fileName)

    const imageUrl = urlData.publicUrl

    // Obtener posición para la nueva imagen (siguiente número)
    const { count } = await supabaseAdmin
      .from('product_images')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', productId)

    const position = count || 0

    // Insertar registro en product_images
    const { data: imageRecord, error: dbError } = await supabaseAdmin
      .from('product_images')
      .insert({
        product_id: productId,
        url: imageUrl,
        alt: file.name,
        position
      })
      .select()
      .single()

    if (dbError) {
      console.error('DB error:', dbError)
      // Intentar limpiar archivo subido si falla el DB
      await supabaseAdmin.storage.from('product-images').remove([fileName])
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, image: imageRecord })
  } catch (error: any) {
    console.error('Upload image error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

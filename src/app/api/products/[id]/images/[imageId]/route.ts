import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const authenticated = await isAuthenticated()
    if (!authenticated) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id: productId, imageId } = await params

    // Obtener información de la imagen antes de eliminarla
    const { data: image, error: fetchError } = await supabaseAdmin
      .from('product_images')
      .select('url, product_id')
      .eq('id', imageId)
      .single()

    if (fetchError || !image) {
      return NextResponse.json({ error: 'Imagen no encontrada' }, { status: 404 })
    }

    // Verificar que la imagen pertenece al producto
    if (image.product_id !== productId) {
      return NextResponse.json({ error: 'La imagen no pertenece a este producto' }, { status: 403 })
    }

    // Eliminar registro de la base de datos
    const { error: deleteDbError } = await supabaseAdmin
      .from('product_images')
      .delete()
      .eq('id', imageId)

    if (deleteDbError) {
      console.error('Error eliminando registro de imagen:', deleteDbError)
      return NextResponse.json({ error: 'No se pudo eliminar la imagen' }, { status: 500 })
    }

    // Intentar eliminar archivo de Supabase Storage
    try {
      // Extraer path del storage desde la URL
      // URL típica: https://[project].supabase.co/storage/v1/object/public/product-images/[productId]/[timestamp].[ext]
      const urlParts = image.url.split('/product-images/')
      if (urlParts.length === 2) {
        const storagePath = urlParts[1]
        
        const { error: storageError } = await supabaseAdmin.storage
          .from('product-images')
          .remove([storagePath])

        if (storageError) {
          console.error('Error eliminando archivo de storage (no crítico):', storageError)
          // No devolver error, el registro ya fue eliminado
          return NextResponse.json({
            success: true,
            warning: 'Registro eliminado, pero el archivo de storage requiere limpieza manual'
          })
        }
      }
    } catch (storageErr) {
      console.error('Error al intentar eliminar de storage:', storageErr)
      // No es crítico, el registro ya fue eliminado
    }

    return NextResponse.json({ success: true, message: 'Imagen eliminada correctamente' })
  } catch (error: any) {
    console.error('Error eliminando imagen:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

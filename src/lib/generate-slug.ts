import { supabaseAdmin } from './supabase-admin'

/**
 * Parámetros para generar slug
 */
interface SlugParams {
  brand: string
  title: string
  model?: string | null
  color?: string | null
}

/**
 * Genera slug base URL-safe basado en brand + model + title + color
 * Evita duplicar palabras (e.g., "chanel-25-negra" no "chanel-25-negra-negra")
 */
export function generateSlugBase(params: SlugParams): string {
  const { brand, title, model, color } = params
  
  // Combinar todas las partes disponibles
  const parts: string[] = []
  
  if (brand) parts.push(brand)
  if (model) parts.push(model)
  if (title) parts.push(title)
  if (color) parts.push(color)
  
  // Unir partes en texto único
  const fullText = parts.join(' ')
  
  // Normalizar y dividir en palabras
  const normalized = normalizeText(fullText)
  const words = normalized.split(/\s+/).filter(w => w.length > 0)
  
  // Eliminar duplicados manteniendo orden (primera aparición)
  const uniqueWords = Array.from(new Set(words))
  
  // Unir con guiones
  return uniqueWords.join('-')
}

/**
 * Normaliza texto a formato slug-friendly
 * - Lowercase
 * - Sin acentos
 * - ñ → n
 * - Solo a-z, 0-9, espacios
 * - Múltiples espacios → uno solo
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD') // Descomponer caracteres con acentos
    .replace(/[\u0300-\u036f]/g, '') // Remover marcas diacríticas
    .replace(/ñ/g, 'n') // ñ → n
    .replace(/[^a-z0-9\s]/g, ' ') // Caracteres especiales → espacios
    .trim()
    .replace(/\s+/g, ' ') // Múltiples espacios → uno
}

/**
 * Asegura que el slug sea único en la base de datos
 * Si existe, agrega sufijo numérico: slug-2, slug-3, etc.
 */
export async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  // Verificar si slug base está disponible
  const { data: existing } = await supabaseAdmin
    .from('products')
    .select('slug')
    .eq('slug', baseSlug)
    .maybeSingle()
  
  if (!existing) {
    return baseSlug // Slug base está libre
  }
  
  // Buscar sufijo numérico disponible
  for (let i = 2; i <= 100; i++) {
    const candidate = `${baseSlug}-${i}`
    
    const { data: candidateExists } = await supabaseAdmin
      .from('products')
      .select('slug')
      .eq('slug', candidate)
      .maybeSingle()
    
    if (!candidateExists) {
      return candidate // Sufijo disponible
    }
  }
  
  // Fallback extremo: UUID corto (solo si 100 colisiones)
  const shortId = generateShortId()
  return `${baseSlug}-${shortId}`
}

/**
 * Genera ID corto aleatorio (8 caracteres)
 * Solo usado como fallback extremo
 */
function generateShortId(): string {
  return Math.random().toString(36).substring(2, 10)
}

/**
 * Función principal: genera slug único listo para usar
 */
export async function generateUniqueSlug(params: SlugParams): Promise<string> {
  const baseSlug = generateSlugBase(params)
  return await ensureUniqueSlug(baseSlug)
}

# Vercel Deploy Protocol — Bagclue

**Status:** Auto-deploy NO CONFIABLE (activo desde 10 May 2026)

## Problema detectado

Auto-deploy de Vercel para Bagclue NO se triggeró correctamente en múltiples ocasiones:
- Push exitoso a GitHub main ✅
- Auto-deploy NO ejecutado ❌
- Production quedó en commit viejo (`ad7f144`) por 2+ días
- Reportes de "deploy exitoso" basados en push, no en verificación real

## Protocolo obligatorio después de cada push

### 1. Verificar production commit real
```bash
# GitHub HEAD
git rev-parse HEAD

# Esperar 2-3 minutos después del push

# Verificar headers Vercel
curl -I https://bagclue.vercel.app/ | grep x-vercel-id

# Si age alto o deployment ID antiguo → auto-deploy falló
```

### 2. Si production NO coincide con GitHub HEAD
**Hacer deploy manual con Vercel CLI:**
```bash
cd bagclue
VERCEL_TOKEN='<token-seguro>' npx vercel --prod --yes --confirm
```

**NO imprimir token en logs.**

### 3. Validar la ruta afectada
```bash
# Para cambios de inventario/productos
curl -I https://bagclue.vercel.app/catalogo

# Para cambios de checkout/payments
curl -I https://bagclue.vercel.app/checkout/success
```

### 4. Revisar headers si la ruta tiene inventario o datos dinámicos
**Esperado para /catalogo (force-dynamic):**
```
age: 0-5
x-vercel-cache: MISS
cache-control: private, no-cache, no-store
(sin x-nextjs-prerender)
```

**Red flag (caché edge antiguo):**
```
age: >100
x-vercel-cache: HIT
x-nextjs-prerender: 1
```

### 5. NO reportar "deploy exitoso" solo por push/build

**Evidencia requerida para confirmar deploy:**
- ✅ Production commit = GitHub HEAD
- ✅ Headers muestran deployment ID reciente
- ✅ Age bajo (<10s) en primera validación post-deploy
- ✅ Ruta afectada muestra cambio esperado

## Posibles causas del auto-deploy fallido

1. Auto-deploy desactivado en configuración Vercel
2. Branch protection bloqueando auto-deploy
3. Webhook GitHub → Vercel roto
4. Rate limit Vercel
5. Configuración Vercel apuntando a branch diferente

**Acción pendiente:** Investigar configuración Vercel dashboard.

## Lecciones aprendidas

- ❌ Push ≠ Deploy
- ❌ Build PASS ≠ Production actualizada
- ✅ Siempre verificar deployment ID/commit real
- ✅ Headers son evidencia, no suposición
- ✅ SKILL — Vercel Deploy Verification es OBLIGATORIO

## Última actualización
2026-05-10 12:03 UTC

## Responsable
Kepler

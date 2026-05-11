# AGGRESSIVE CACHE CLEAR — React Error #418 Verification

**Context:** Deploy forzado completado (commit `dfbb225`). Error #418 puede persistir por cache.

---

## PASO 1: LIMPIAR CACHE DE CHROME COMPLETAMENTE

1. **Abrir Chrome DevTools** (F12 o Cmd+Option+I)
2. **Click derecho en botón de refresh** (junto a la URL)
3. **Seleccionar:** "Empty Cache and Hard Reload" (Vaciar caché y recargar de manera forzada)
4. **Esperar** a que cargue completamente

---

## PASO 2: LIMPIAR SITE DATA

1. **Abrir DevTools** → Pestaña **Application**
2. **Sidebar izquierdo** → "Storage"
3. **Click en "Clear site data"**
4. **Confirmar**
5. **Cerrar pestaña completamente**

---

## PASO 3: NAVEGACIÓN INCÓGNITO (RECOMENDADO)

1. **Abrir ventana incógnito** (Cmd+Shift+N o Ctrl+Shift+N)
2. **Navegar a:** https://bagclue.vercel.app/admin/login
3. **Login:** `bagclue2026`
4. **Ir a:** https://bagclue.vercel.app/admin/orders/57faad17-94b5-4ec0-a428-320059469335
5. **Abrir DevTools** (F12)
6. **Console** → limpiar

---

## PASO 4: VERIFICACIÓN FINAL

**Checklist:**
- [ ] **Consola limpia** (sin React error #418)
- [ ] **Montos con formato:** $20, $1,000, $89,900 (CON comas si >999)
- [ ] **Fechas visibles:** "Creada", "Actualizada", "Subido"
- [ ] **Comprobante visible:** Sección "Comprobante de envío"
- [ ] **Scroll completo** (arriba → abajo) sin errores
- [ ] **Refresh adicional** (F5) → sin errores

---

## SI EL ERROR PERSISTE:

**Reportar:**
1. Screenshot de consola con error visible
2. Expandir una línea del stacktrace (click en flecha ▶) → copiar texto
3. Verificar si el monto muestra: "$20" o "$20,000" (con/sin coma)
4. Verificar si las fechas muestran texto legible o "Cargando..."

**Posibles causas restantes:**
- Vercel no desplegó commit correcto (necesitaríamos verificar en Vercel dashboard)
- Otra fuente de hydration mismatch no identificada
- Componente server-side renderizando estado dinámico

---

## COMMIT ESPERADO EN PRODUCCIÓN

**Último commit:** `dfbb225` — "chore: Force Vercel redeploy - React error #418 fix verification"  
**Previo:** `e31e614` — "Fix: React error #418 - Replace number toLocaleString() with stable formatNumber()"

**Cambios aplicados:**
- ✅ ClientDate component para fechas
- ✅ formatNumber() para montos (subtotal, envío, total)
- ✅ Reemplazo de 4 instancias de toLocaleString() en /admin/orders/[id]

---

## ALTERNATIVA: VERIFICAR VERCEL DEPLOY

Si tienes acceso al dashboard de Vercel:
1. Ir a proyecto Bagclue
2. Pestaña "Deployments"
3. Verificar que el último deploy tiene commit hash `dfbb225` o `e31e614`
4. Si no coincide → deploy manual con Vercel CLI

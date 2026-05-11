# INSTRUCCIONES — TEST DE AISLAMIENTO LOCAL

**Objetivo:** Identificar si el error React #418 viene del layout/nav o del contenido de order detail.

---

## PASO 1: ACTIVAR TEST DE AISLAMIENTO

```bash
cd /home/node/.openclaw/workspace/bagclue/src/app/admin/orders/[id]
cp page.test-isolation.tsx page.tsx
cd /home/node/.openclaw/workspace/bagclue
npm run build
npm run start
```

---

## PASO 2: ABRIR EN NAVEGADOR

1. Abrir: http://localhost:3000/admin/login
2. Login con password: `bagclue2026`
3. Navegar a: http://localhost:3000/admin/orders/57faad17-94b5-4ec0-a428-320059469335

---

## PASO 3: VERIFICAR CONSOLA

1. **Abrir DevTools** (F12 o Cmd+Option+I)
2. **Console tab** → Limpiar (🚫)
3. **Hard refresh** (Cmd+Shift+R o Ctrl+Shift+F5) x3
4. **Verificar consola cada vez**

---

## RESULTADO ESPERADO

### ✅ Si React #418 NO APARECE con "TEST ORDER PAGE"
**Conclusión:** El error viene del **CONTENIDO** de order detail (AdminNav, forms, datos).  
**Siguiente paso:** TAREA 4 (aislar bloques dentro de page.client.tsx)

### ❌ Si React #418 APARECE incluso con "TEST ORDER PAGE"
**Conclusión:** El error viene del **LAYOUT/NAV** compartido (admin layout, AdminNav).  
**Siguiente paso:** TAREA 3 (auditar AdminNav y layout)

---

## RESTAURAR CÓDIGO ORIGINAL

```bash
cd /home/node/.openclaw/workspace/bagclue/src/app/admin/orders/[id]
cp page.tsx.backup page.tsx
```

---

## REPORTAR

**Formato:**
```
TEST DE AISLAMIENTO LOCAL:
- URL: http://localhost:3000/admin/orders/57faad17-94b5-4ec0-a428-320059469335
- Página muestra: "TEST ORDER PAGE - ID: 57faad17..."
- Hard refresh x3 realizado: YES
- React #418 aparece: YES/NO
- Consola limpia: YES/NO

CONCLUSIÓN: Error viene de LAYOUT/NAV o CONTENIDO
```

# BAGCLUE POST-LAUNCH ROADMAP

**Última actualización:** 2026-05-11  
**Status:** Features postponed para después de Stripe Live activation  

---

## P1 — SHIPPING PROOF MVP

**Prioridad:** HIGH  
**Complejidad:** LOW-MEDIUM  
**Tiempo estimado:** 4 horas  
**Status:** ⏳ PENDING (post-launch)

**Propósito:**
Permitir que admin suba comprobante/guía de envío cuando marca pedido como shipped. Cliente recibe email con link y puede ver documento desde tracking page.

**Decisión:**
Postponed para después de validar Stripe Live + primeros pagos reales. No es blocker para activar ventas.

**Motivo:**
- No blocker para ventas reales
- Requiere migration + bucket + UI upload + tracking page (riesgo pre-launch)
- Admin puede enviar comprobante por WhatsApp/Instagram temporalmente
- Implementar limpio después de validar pagos reales

**Documentación completa:**
- Scope: `SHIPPING_PROOF_MVP_SCOPE.md` (31.9 KB)
- Audit: `SHIPPING_PROOF_MVP_AUDIT_REPORT.md` (23.8 KB)

**Archivos a modificar (7):**
1. Migration SQL (4 columnas + bucket)
2. `/api/orders/[id]/shipping/route.ts`
3. `src/lib/supabase-upload-shipping.ts` (nuevo)
4. `MarcarEnviadoModal.tsx`
5. `shipping-tracking.ts` (email template)
6. Tracking page `/track/[token]`
7. Types (opcional)

**Implementation plan:**
- Fase 1: Backend (1h 30min)
- Fase 2: Frontend admin (1h 10min)
- Fase 3: Email + tracking (50min)
- Fase 4: QA (30min)

**Trigger para implementación:**
- ✅ Stripe Live activo
- ✅ Primera venta real confirmada
- ✅ Flujos de pago validados en producción

---

## P2 — OTROS (TBD)

**Agregar features aquí según prioridad post-launch**

---

END OF ROADMAP

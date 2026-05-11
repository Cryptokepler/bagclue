# BAGCLUE PRE-LIVE FINAL CHECKLIST

**Date:** 2026-05-11  
**Audited by:** Kepler  
**Purpose:** Determine if Bagclue is ready for real sales  

---

## EXECUTIVE SUMMARY

**LISTA PARA PRODUCCIÓN:** ❌ **NO**

**Critical Blockers (P0):**
1. ❌ No products available for sale (0 published, 0 with images)
2. ❌ Test API endpoints exposed in production (`/api/test-email`, `/api/test-callback-flow`)
3. ⚠️ Real products missing images and publication

**Status:** Bagclue is NOT ready for live sales until P0 blockers are resolved.

---

## 1. PRODUCTOS TEST

### Audit Results

| Metric | Count | Status |
|--------|-------|--------|
| Total products in DB | 23 | ℹ️ |
| Test products detected | 17 | ⚠️ |
| Test products published | 0 | ✅ |
| Real products | 6 | ⚠️ |
| Real products published | 0 | ❌ |

### Test Products (17 detected)

**Status:** ✅ **PASS** — All test products are unpublished

**Detected test products:**
1. QA Email Stripe Confirmación (sold, unpublished) ✅
2. QA Email Comprobante Rechazado (available, unpublished) ✅
3. QA Email Pago Confirmado (sold, unpublished) ✅
4. QA Email Bank Instructions (sold, unpublished) ✅
5. QA Transferencia Aprobar (sold, unpublished) ✅
6. Test Stripe No-Regression (available, unpublished) ✅
7. Test Bank Transfer Fix - MVP.2B (sold, unpublished) ✅
8. QA Test Stripe - MVP.2B (available, unpublished) ✅
9. QA Test MVP.2B - Bank Transfer (sold, unpublished) ✅
10. QA Stripe Regression Test (sold, unpublished) ✅
11. QA Bank Transfer Reject Test (available, unpublished) ✅
12. TEST PRODUCT QA MVP.2A (sold, unpublished) ✅
13. QA Manual Imagen MVP1C (available, unpublished) ✅
14. QA Inventario MVP1C (available, unpublished) ✅
15. Test Banner Producto (available, unpublished) ✅
16. Test Inventario MVP1C (available, unpublished) ✅
17. Negra Test Slug (sold, unpublished) ✅

**Recommendation:** Keep unpublished. Consider deleting to reduce DB clutter after launch.

---

## 2. INVENTARIO REAL

### Audit Results

| Metric | Count | Status |
|--------|-------|--------|
| Total real products | 6 | ⚠️ |
| Published | 0 | ❌ |
| Available for sale | 0 | ❌ |
| With images | 0 | ❌ |

### Real Products Inventory

#### Product 1: Pm St. Louis rosa
- **ID:** 28f4c7c4-deb8-423e-b6a0-900ee399b85a
- **Brand:** Goyard ✅
- **Model:** Pm St. Louis rosa edición limitada ✅
- **Price:** $89,900 MXN ✅
- **Stock:** 1 ✅
- **Status:** available ✅
- **Published:** ❌ NO
- **Images:** ❌ 0
- **Issues:** Not published, No images

**Action required:** Upload images + publish

---

#### Product 2: Goyard Anjou PM Vino
- **ID:** cc573dde-815c-4e80-b68e-659609605743
- **Brand:** Goyard ✅
- **Model:** Anjou PM ✅
- **Price:** $63,000 MXN ✅
- **Stock:** 1 ✅
- **Status:** available ✅
- **Published:** ❌ NO
- **Images:** ❌ 0
- **Issues:** Not published, No images

**Action required:** Upload images + publish

---

#### Product 3: 25 small negra
- **ID:** 5dc47bcb-50e7-4384-bce1-c517f765c146
- **Brand:** Chanel ✅
- **Model:** 25 ✅
- **Price:** $189,000 MXN ✅
- **Stock:** 0 ⚠️
- **Status:** sold ℹ️
- **Published:** NO
- **Images:** 0

**Note:** Already sold, no action required

---

#### Product 4: 25
- **ID:** cf943ccf-b1d2-40ad-bc10-76e34985d352
- **Brand:** Goyard ✅
- **Model:** Anjou burgundy pm ✅
- **Price:** $63,000 MXN ✅
- **Stock:** 0 ⚠️
- **Status:** available ⚠️
- **Published:** NO
- **Images:** 0
- **Issues:** Title too short ("25"), Stock 0 but status available, Not published, No images

**Action required:** Fix title, fix stock/status mismatch, upload images, publish

---

#### Product 5: Hermès Birkin 30 Gold
- **ID:** 4e661f62-91c5-49e2-8ec3-3408171a063c
- **Brand:** Hermès ✅
- **Model:** Birkin 30 ✅
- **Price:** $450,000 MXN ✅
- **Stock:** 0
- **Status:** sold ℹ️
- **Published:** NO
- **Images:** 0

**Note:** Already sold, no action required

---

#### Product 6: Chanel Classic Flap Negro
- **ID:** 9ed1749d-b82b-4ac5-865e-f2f332c439c3
- **Brand:** Chanel ✅
- **Model:** Classic Flap 25 Mediana ✅
- **Price:** $189,000 MXN ✅
- **Stock:** 1 ✅
- **Status:** available ✅
- **Published:** ❌ NO
- **Images:** ❌ 0
- **Issues:** Not published, No images

**Action required:** Upload images + publish

---

### Summary: Real Products

**Available for sale (after fixes):**
- Pm St. Louis rosa (Goyard) — needs images + publish
- Goyard Anjou PM Vino — needs images + publish
- Product "25" (Goyard) — needs title fix + stock fix + images + publish
- Chanel Classic Flap Negro — needs images + publish

**Total saleable after fixes:** 4 products

**Critical blocker:** ❌ 0 products currently ready for sale

---

## 3. FLUJO STRIPE TEST

### Status: ⚠️ NOT AUDITED (manual test required)

**Test plan:**
1. Create checkout session for test product
2. Complete payment with Stripe test card (4242 4242 4242 4242)
3. Verify webhook received
4. Verify order created with status `paid`
5. Verify confirmation email sent
6. Verify product marked as `sold`
7. Verify CTA "Confirmar dirección" visible
8. Verify tracking page accessible

**Action required:** Execute full Stripe test flow before going live

---

## 4. FLUJO TRANSFERENCIA BANCARIA MXN

### Status: ⚠️ NOT AUDITED (manual test required)

**Test plan:**
1. Create order with bank transfer payment method
2. Verify email with instructions sent (CLABE, reference, expiration)
3. Upload fake proof (PDF/image)
4. Verify "Comprobante recibido" email sent
5. Admin: verify payment visible in `/admin/payments`
6. Admin: approve payment
7. Verify "Pago confirmado" email sent
8. Client: verify order status updated
9. Verify CTA "Confirmar dirección" visible
10. Admin: verify order appears in `/admin/envios`

**Action required:** Execute full bank transfer flow before going live

---

## 5. FLUJO RECHAZO TRANSFERENCIA

### Status: ⚠️ NOT AUDITED (manual test required)

**Test plan:**
1. Create order with bank transfer
2. Upload proof
3. Admin: reject proof with reason
4. Verify "Comprobante rechazado" email sent
5. Client: verify can upload new proof
6. Verify product reverts to `available` if order expires
7. Verify client can retry payment

**Action required:** Execute rejection flow before going live

---

## 6. FLUJO ENVÍO

### Status: ⚠️ NOT AUDITED (manual test required)

**Test plan:**
1. Create paid order (Stripe or bank transfer)
2. Admin: mark as shipped with tracking number
3. Verify "Tu pieza va en camino" email sent
4. Client: verify tracking page shows shipping info
5. Verify tracking number clickable (if provider link available)
6. Admin: mark as delivered
7. Verify order status updated

**Action required:** Execute shipping flow before going live

---

## 7. CUENTA CLIENTE

### Status: ✅ PASS (partially tested)

| Feature | Status | Notes |
|---------|--------|-------|
| Login Google OAuth | ✅ PASS | Tested successfully |
| Magic Link | ⚠️ NOT TESTED | Code exists, not validated |
| Welcome email | ✅ PASS | Confirmed working (Fase 3) |
| Mis pedidos | ⚠️ NOT TESTED | Code exists, needs validation |
| Direcciones | ⚠️ NOT TESTED | Code exists, needs validation |
| Tracking público | ⚠️ NOT TESTED | `/track/[token]` exists |

**Action required:** Test magic link, mis pedidos, direcciones, tracking

---

## 8. ADMIN

### Status: ⚠️ PARTIALLY AUDITED

| Route | Exists | Tested | Status |
|-------|--------|--------|--------|
| `/admin` | ✅ | ⚠️ | Needs validation |
| `/admin/productos` | ✅ | ⚠️ | Needs validation |
| `/admin/payments` | ✅ | ⚠️ | Needs validation |
| `/admin/envios` | ✅ | ⚠️ | Needs validation |
| `/admin/orders` | ✅ | ⚠️ | Needs validation |

**Features to validate:**
- Filters (inventario, pagos, envíos)
- Pagos pendientes list
- Aprobación/rechazo de comprobantes
- Envíos pendientes list
- Marcar enviado con tracking
- Marcar entregado

**Action required:** Execute full admin flow validation

---

## 9. SEGURIDAD

### Audit Results

| Check | Status | Details |
|-------|--------|---------|
| Test products public | ✅ PASS | All unpublished |
| Test API endpoints | ❌ **FAIL** | `/api/test-email` and `/api/test-callback-flow` accessible |
| Secrets in repo | ✅ PASS | No secrets committed (`.env.local` in `.gitignore`) |
| Secrets in logs | ⚠️ NOT AUDITED | Requires Vercel logs review |
| CLABE in docs/logs | ⚠️ NOT AUDITED | Requires manual review |
| Tracking tokens in logs | ⚠️ NOT AUDITED | Requires Vercel logs review |
| CRON protected | ✅ PASS | 401 without CRON_SECRET |
| Admin protected | ⚠️ NOT TESTED | Requires authentication validation |

**Critical blocker:** ❌ Test API endpoints must return 404 in production

### Test Endpoints Found

```
GET /api/test-email?email=<email>
→ {"error":"Missing email parameter"}
Status: 200 ❌ (should be 404)

GET /api/test-callback-flow?user_id=<id>
→ {"error":"Missing user_id parameter"}
Status: 200 ❌ (should be 404)
```

**Action required:**
1. Delete or disable `/api/test-email` and `/api/test-callback-flow` in production
2. Review Vercel logs for exposed secrets
3. Test admin authentication

---

## 10. VERCEL / DEPLOY

### Audit Results

| Check | Status | Details |
|-------|--------|---------|
| Production commit | ✅ PASS | c1a9f16 (HEAD = main) |
| Auto-deploy reliability | ⚠️ KNOWN ISSUE | Auto-deploy considered unreliable (Política 12) |
| Manual deploy process | ✅ DOCUMENTED | Vercel CLI with token from `contraseñas/vercel_token_nuevo.md` |
| Deploy verification | ✅ DOCUMENTED | Política 12 — Vercel Deploy Verification in MEMORY.md |

**Production commit:**
- Commit: `c1a9f16678241ab392ef1ca7852b5a359df96756`
- Message: "feat(welcome-email): Implement CRON-based reliable delivery"
- Date: 2026-05-11

**Critical pages to validate before launch:**

| Page | Status | Action Required |
|------|--------|-----------------|
| `/` (Home) | ⚠️ | Manual visual check |
| `/catalogo` | ⚠️ | Verify products load (currently 0 published) |
| `/catalogo/[id]` | ⚠️ | Test with real product |
| `/cart` | ⚠️ | Test add to cart flow |
| `/checkout/success` | ⚠️ | Test after Stripe payment |
| `/account` | ✅ | Tested (working) |
| `/account/login` | ✅ | Tested (working) |
| `/account/orders` | ⚠️ | Not tested |
| `/account/orders/[id]` | ⚠️ | Not tested |
| `/admin` | ⚠️ | Not tested |
| `/admin/productos` | ⚠️ | Not tested |
| `/admin/payments` | ⚠️ | Not tested |
| `/admin/envios` | ⚠️ | Not tested |
| `/track/[token]` | ⚠️ | Not tested |

**Recommendation:** Manual QA on all critical pages before launch

---

## 11. STRIPE LIVE READINESS

### Current Configuration (Test Mode)

**Stripe keys (from `.env.local`):**
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51SQA4a2KuAFNA49O...
STRIPE_SECRET_KEY=sk_test_51SQA4a2KuAFNA49O...
STRIPE_WEBHOOK_SECRET=whsec_GIKc7IHPNkTBt3pThbLfYMe61gcq0ReY
```

**Status:** ✅ Test mode active

---

### Transition to Live Mode

**Variables to change:**

| Variable | Current (Test) | Required (Live) | Location |
|----------|----------------|-----------------|----------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` | `pk_live_...` | Vercel Production |
| `STRIPE_SECRET_KEY` | `sk_test_...` | `sk_live_...` | Vercel Production |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (test) | `whsec_...` (live) | Vercel Production |

**Webhook endpoint:**
- Current: `https://bagclue.vercel.app/api/stripe/webhook`
- Live webhook: Must be registered in Stripe Live Dashboard
- Events to listen: `checkout.session.completed`, `payment_intent.succeeded`

---

### Risks of Mixing Test/Live

**Critical risks:**
1. ❌ Live payments processed with test webhook secret → payments lost
2. ❌ Test payments in live mode → customer charged but order not created
3. ❌ Mixing keys → undefined behavior, possible data corruption

**Mitigation:**
- ✅ Change ALL three variables atomically (single deploy)
- ✅ Test webhook with Stripe CLI before going live
- ✅ Monitor Vercel logs for webhook errors
- ✅ Have rollback plan ready

---

### Rollback Plan (Live → Test)

**If live mode fails:**

1. **Revert environment variables in Vercel:**
   ```
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_... (test)
   ```

2. **Redeploy with Vercel CLI**

3. **Verify test mode working:**
   - Test checkout with 4242 4242 4242 4242
   - Verify webhook received
   - Verify order created

**Estimated rollback time:** ~5 minutes

**Risk:** Low (environment variables only, no code changes)

---

### Controlled Live Purchase Plan

**Before public launch:**

1. **Configure Stripe Live keys** (Vercel Production only, not in repo)
2. **Deploy with manual verification** (Política 12)
3. **Register webhook in Stripe Live Dashboard**
4. **Test with small real purchase** ($1-10 MXN test product)
   - Use real card (not test card)
   - Verify webhook received
   - Verify order created with status `paid`
   - Verify confirmation email sent
   - Verify product marked `sold`
5. **If test PASS:** Publish real products
6. **If test FAIL:** Rollback to test mode, diagnose, fix, retry

**Recommendation:** Create a $10 MXN "Test Real Payment" product for live validation

---

## 12. BLOCKERS SUMMARY

### P0 — Critical (Must Fix Before Launch)

| # | Blocker | Impact | Estimated Fix Time |
|---|---------|--------|-------------------|
| 1 | No products available for sale | ❌ Cannot sell anything | ~2-4 hours (upload images + publish) |
| 2 | Test API endpoints exposed | 🔒 Security risk | ~15 min (delete routes + redeploy) |

**Total estimated time to resolve P0:** ~3-5 hours

---

### P1 — High Priority (Should Fix Before Launch)

| # | Issue | Impact | Estimated Fix Time |
|---|-------|--------|-------------------|
| 1 | Product "25" has invalid title | ⚠️ Poor UX | ~5 min |
| 2 | Product "25" stock/status mismatch | ⚠️ Inventory error | ~5 min |
| 3 | Full Stripe test flow not validated | ⚠️ Payment risk | ~30 min |
| 4 | Full bank transfer flow not validated | ⚠️ Payment risk | ~30 min |
| 5 | Admin flows not validated | ⚠️ Operations risk | ~1 hour |

**Total estimated time for P1:** ~2-3 hours

---

### P2 — Medium Priority (Can Fix After Launch)

| # | Issue | Impact | Estimated Fix Time |
|---|-------|--------|-------------------|
| 1 | Magic link not tested | ℹ️ Alternative auth | ~15 min |
| 2 | Client dashboard not fully tested | ℹ️ UX | ~30 min |
| 3 | 17 test products cluttering DB | ℹ️ DB hygiene | ~10 min |

**Total estimated time for P2:** ~1 hour

---

## 13. RECOMMENDATION

### LISTA PARA PRODUCCIÓN: ❌ **NO**

**Why:**
- ❌ 0 products available for sale (BLOCKER P0)
- ❌ Test API endpoints exposed (BLOCKER P0)
- ⚠️ Payment flows not fully validated
- ⚠️ Admin flows not fully validated

**Minimum requirements to go live:**
1. ✅ Publish at least 1 product with images
2. ✅ Remove test API endpoints
3. ✅ Validate full Stripe test flow
4. ✅ Validate full bank transfer flow
5. ✅ Validate admin payment approval flow
6. ✅ Validate shipping flow
7. ✅ Test Stripe Live with controlled real purchase

---

## 14. PRÓXIMOS PASOS (AFTER FIXING BLOCKERS)

### Phase 1: Fix P0 Blockers (~3-5 hours)

1. **Upload product images** (2-4 hours)
   - Pm St. Louis rosa
   - Goyard Anjou PM Vino
   - Chanel Classic Flap Negro
   - Fix product "25" title + stock

2. **Publish products** (5 min)
   - Set `published = true` for saleable products

3. **Remove test endpoints** (15 min)
   - Delete `src/app/api/test-email/`
   - Delete `src/app/api/test-callback-flow/`
   - Redeploy with verification (Política 12)
   - Verify 404: `curl -I https://bagclue.vercel.app/api/test-email`

---

### Phase 2: Validate Payment Flows (~2-3 hours)

1. **Stripe test flow** (30 min)
2. **Bank transfer test flow** (30 min)
3. **Bank transfer rejection flow** (30 min)
4. **Admin approval flow** (30 min)
5. **Shipping flow** (30 min)

---

### Phase 3: Stripe Live Transition (~1 hour)

1. **Get Stripe Live keys from Stripe Dashboard**
2. **Register webhook in Stripe Live:**
   - URL: `https://bagclue.vercel.app/api/stripe/webhook`
   - Events: `checkout.session.completed`, `payment_intent.succeeded`
3. **Configure Vercel Production environment variables:**
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...`
   - `STRIPE_SECRET_KEY=sk_live_...`
   - `STRIPE_WEBHOOK_SECRET=whsec_...` (live)
4. **Redeploy with verification**
5. **Test webhook with Stripe CLI:**
   ```
   stripe listen --forward-to https://bagclue.vercel.app/api/stripe/webhook
   stripe trigger checkout.session.completed
   ```

---

### Phase 4: Controlled Real Purchase (~30 min)

1. **Create $10 MXN test product** (optional)
2. **Make real purchase with personal card**
3. **Verify:**
   - Webhook received ✅
   - Order created ✅
   - Email sent ✅
   - Product marked sold ✅
4. **If PASS:** Proceed to public launch
5. **If FAIL:** Rollback to test mode, diagnose, fix

---

### Phase 5: Public Launch

1. **Announce on Instagram** (@salebybagcluemx)
2. **Monitor Vercel logs** (first 24h)
3. **Respond to customer inquiries**
4. **Track sales metrics**

---

## 15. ESTIMATED TIMELINE

**Minimum time to launch:**
- P0 fixes: 3-5 hours
- Payment validation: 2-3 hours
- Stripe Live setup: 1 hour
- Controlled test: 30 min
- **Total: 7-10 hours of work**

**Recommended timeline:**
- **Day 1:** Fix P0 blockers (products + test endpoints)
- **Day 2:** Validate all payment flows
- **Day 3:** Stripe Live + controlled test + public launch

---

## 16. CONTACT

**Questions or issues:**
- Agent: Kepler
- Reference: BAGCLUE_PRE_LIVE_FINAL_CHECKLIST.md
- Date: 2026-05-11

---

END OF CHECKLIST

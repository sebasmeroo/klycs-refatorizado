# Guía de Integración de Stripe

## ✅ Configuración Completada

### 1. Firebase Functions Desplegadas
- ✅ `stripeEnsureCustomer` - Crear/obtener cliente de Stripe
- ✅ `stripeCreateCheckoutSession` - Crear sesión de pago
- ✅ `stripeCreateBillingPortalSession` - Portal de facturación
- ✅ `stripeWebhook` - Webhook para eventos de Stripe

**URL del Webhook:** `https://stripewebhook-72cc6w7wkq-uc.a.run.app`

### 2. Stripe Dashboard Configurado
- ✅ Plan FREE: `price_1SG4luLI966WBNFGY9HUIdhP`
- ✅ Plan PRO: `price_1SG4nOLI966WBNFGSHBfj4GB`
- ✅ Plan BUSINESS: `price_1SG4o7LI966WBNFG67tvhEM6`
- ✅ Webhook configurado con eventos: checkout.session.completed, customer.subscription.*, invoice.*

### 3. Variables de Entorno
- ✅ `.env` - Publishable Key configurada
- ✅ `functions/.env.functions` - Secret Key y Webhook Secret configurados

---

## 🚀 Cómo Usar en tu Aplicación

### Paso 1: Importar la configuración

```typescript
import { STRIPE_PRICE_IDS } from '@/config/stripe';
import { getFunctions, httpsCallable } from 'firebase/functions';
```

### Paso 2: Asegurar que el usuario tiene un cliente de Stripe

```typescript
const functions = getFunctions();

// Llamar antes de crear checkout session
const ensureCustomer = httpsCallable(functions, 'stripeEnsureCustomer');
const { data: customer } = await ensureCustomer();
console.log('Customer ID:', customer.stripeCustomerId);
```

### Paso 3: Crear una sesión de checkout

```typescript
import { STRIPE_PRICE_IDS } from '@/config/stripe';

const createCheckout = httpsCallable(functions, 'stripeCreateCheckoutSession');

const { data } = await createCheckout({
  priceId: STRIPE_PRICE_IDS.PRO, // o FREE o BUSINESS
  successUrl: `${window.location.origin}/subscription/success`,
  cancelUrl: `${window.location.origin}/subscription/cancel`,
  trialDays: 14, // Opcional: prueba gratuita de 14 días
  metadata: { // Opcional
    userId: currentUser.uid,
    source: 'pricing_page'
  }
});

// Redirigir al usuario a Stripe Checkout
window.location.href = data.url;
```

### Paso 4: Portal de facturación (gestión de suscripción)

```typescript
const createPortal = httpsCallable(functions, 'stripeCreateBillingPortalSession');

const { data } = await createPortal({
  returnUrl: `${window.location.origin}/settings`
});

// Redirigir al portal de Stripe
window.location.href = data.url;
```

---

## 📊 Ejemplo Completo: Componente de Pricing

```typescript
import { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { STRIPE_PRICE_IDS } from '@/config/stripe';

export function PricingPage() {
  const [loading, setLoading] = useState(false);
  const functions = getFunctions();

const handleSubscribe = async (plan: 'FREE' | 'PRO' | 'BUSINESS') => {
    try {
      setLoading(true);

      // 1. Asegurar que existe el customer
      const ensureCustomer = httpsCallable(functions, 'stripeEnsureCustomer');
      await ensureCustomer();

      // 2. Crear checkout session
      const createCheckout = httpsCallable(functions, 'stripeCreateCheckoutSession');
      const { data } = await createCheckout({
        priceId: STRIPE_PRICE_IDS[plan],
        successUrl: `${window.location.origin}/subscription/success`,
        cancelUrl: `${window.location.origin}/pricing`,
      });

      // 3. Redirigir
      window.location.href = data.url;
    } catch (error) {
      console.error('Error:', error);
      alert('Error al procesar el pago. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pricing-plans">
      <div className="plan">
        <h3>Free</h3>
        <p>$0/mes</p>
        <button onClick={() => handleSubscribe('FREE')} disabled={loading}>
          Comenzar Gratis
        </button>
      </div>

      <div className="plan">
        <h3>Pro</h3>
        <p>$9.99/mes</p>
        <button onClick={() => handleSubscribe('PRO')} disabled={loading}>
          Suscribirse
        </button>
      </div>

      <div className="plan">
        <h3>Enterprise</h3>
        <p>$29.99/mes</p>
        <button onClick={() => handleSubscribe('BUSINESS')} disabled={loading}>
          Suscribirse
        </button>
      </div>
    </div>
  );
}
```

---

## 🔍 Verificar Estado de Suscripción

La información de suscripción se sincroniza automáticamente vía webhook a Firestore:

```typescript
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Escuchar cambios en la suscripción del usuario
const userSubRef = doc(db, 'user_subscriptions', userId);

onSnapshot(userSubRef, (snapshot) => {
  if (snapshot.exists()) {
    const subscription = snapshot.data();
    console.log('Plan:', subscription.plan);
    console.log('Status:', subscription.status);
    console.log('Válido hasta:', subscription.currentPeriodEnd);
  }
});
```

---

## 🧪 Testing

### Tarjetas de prueba de Stripe:

- **Pago exitoso:** `4242 4242 4242 4242`
- **Pago rechazado:** `4000 0000 0000 0002`
- **Requiere autenticación:** `4000 0025 0000 3155`

**Fecha de expiración:** Cualquier fecha futura (ej: 12/34)
**CVC:** Cualquier 3 dígitos (ej: 123)
**ZIP:** Cualquier código postal

---

## 🔧 Troubleshooting

### Error: "Customer not found"
Asegúrate de llamar a `stripeEnsureCustomer` antes de crear la checkout session.

### Error: "Invalid price ID"
Verifica que estás usando los Price IDs correctos de `src/config/stripe.ts`

### Webhook no recibe eventos
Verifica en Stripe Dashboard > Developers > Webhooks que el endpoint esté activo y los eventos estén seleccionados.

### Reiniciar servidor de desarrollo
Después de actualizar `.env`, reinicia tu servidor:
```bash
npm run dev
```

---

## 📝 Próximos Pasos

1. **Reinicia tu servidor de desarrollo** para cargar la nueva Publishable Key
2. **Prueba el flujo completo** con una tarjeta de prueba
3. **Verifica en Stripe Dashboard** que los pagos y webhooks funcionen
4. **Configura emails** de confirmación (opcional)
5. **Añade lógica de negocio** basada en el plan del usuario

---

## 🎉 ¡Todo Listo!

Tu integración de Stripe está completamente configurada. Ahora puedes:
- Aceptar pagos
- Gestionar suscripciones
- Sincronizar automáticamente con Firestore
- Dar acceso según el plan del usuario

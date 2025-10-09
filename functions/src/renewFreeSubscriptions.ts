/**
 * Cloud Function: Renovación automática de suscripciones FREE
 *
 * Se ejecuta diariamente para renovar las suscripciones FREE que han expirado
 *
 * Configurar en Firebase Functions:
 * - Ejecutar cada día a las 00:00 UTC
 * - Comando: firebase deploy --only functions:renewFreeSubscriptions
 */

import * as admin from 'firebase-admin';
import {onSchedule} from 'firebase-functions/v2/scheduler';
import {onRequest} from 'firebase-functions/v2/https';

// Inicializar Firebase Admin si no está inicializado
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// Lazy initialization
const getDb = () => admin.firestore();

/**
 * Renovar suscripciones FREE expiradas
 * Ejecuta diariamente a las 00:00 UTC
 */
export const renewFreeSubscriptions = onSchedule({
  schedule: '0 0 * * *',
  timeZone: 'Europe/Madrid'
}, async (_context: any): Promise<void> => {
    try {
      console.log('🔄 Iniciando renovación de suscripciones FREE...');

      const now = admin.firestore.Timestamp.now();
      const db = getDb();

      // Buscar todas las suscripciones FREE activas que hayan expirado
      const expiredSubscriptionsQuery = await db.collection('user_subscriptions')
        .where('status', '==', 'active')
        .where('currentPeriodEnd', '<=', now)
        .get();

      console.log(`📊 Encontradas ${expiredSubscriptionsQuery.size} suscripciones potencialmente expiradas`);

      let renewedCount = 0;
      let errorCount = 0;

      // Procesar cada suscripción expirada
      for (const subscriptionDoc of expiredSubscriptionsQuery.docs) {
        try {
          const subscription = subscriptionDoc.data();

          // Solo renovar si no tiene stripeSubscriptionId (es FREE)
          if (!subscription.stripeSubscriptionId || subscription.stripeSubscriptionId === '') {
            const currentPeriodEnd = subscription.currentPeriodEnd.toDate();

            // Calcular nuevo período (1 mes desde la fecha de expiración)
            const newPeriodStart = new Date(currentPeriodEnd);
            const newPeriodEnd = new Date(currentPeriodEnd);
            newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);

            // Actualizar suscripción
            await db.collection('user_subscriptions').doc(subscriptionDoc.id).update({
              currentPeriodStart: admin.firestore.Timestamp.fromDate(newPeriodStart),
              currentPeriodEnd: admin.firestore.Timestamp.fromDate(newPeriodEnd),
              updatedAt: admin.firestore.Timestamp.now()
            });

            renewedCount++;
            console.log(`✅ Renovada suscripción FREE: ${subscriptionDoc.id} (Usuario: ${subscription.userId})`);
          } else {
            console.log(`⏭️ Saltando suscripción con Stripe: ${subscriptionDoc.id}`);
          }
        } catch (error) {
          errorCount++;
          console.error(`❌ Error renovando suscripción ${subscriptionDoc.id}:`, error);
        }
      }

      console.log(`✅ Proceso completado: ${renewedCount} renovadas, ${errorCount} errores`);

    } catch (error) {
      console.error('❌ Error en renovación automática:', error);
      throw error;
    }
  });

/**
 * También crear función manual para testing
 */
export const renewFreeSubscriptionsManual = onRequest(async (req, res): Promise<void> => {
  try {
    // Verificar autenticación (opcional, agregar si es necesario)
    const authHeader = req.headers.authorization;
    const expectedToken = process.env.ADMIN_MANUAL_TOKEN || 'test-token-change-in-production';

    if (authHeader !== `Bearer ${expectedToken}`) {
      res.status(403).send('Unauthorized');
      return;
    }

    console.log('🔄 Ejecutando renovación manual de suscripciones FREE...');

    const now = admin.firestore.Timestamp.now();
    const db = getDb();

    const expiredSubscriptionsQuery = await db.collection('user_subscriptions')
      .where('status', '==', 'active')
      .where('currentPeriodEnd', '<=', now)
      .get();

    let renewedCount = 0;
    let errorCount = 0;

    for (const subscriptionDoc of expiredSubscriptionsQuery.docs) {
      try {
        const subscription = subscriptionDoc.data();

        if (!subscription.stripeSubscriptionId || subscription.stripeSubscriptionId === '') {
          const currentPeriodEnd = subscription.currentPeriodEnd.toDate();

          const newPeriodStart = new Date(currentPeriodEnd);
          const newPeriodEnd = new Date(currentPeriodEnd);
          newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);

          await db.collection('user_subscriptions').doc(subscriptionDoc.id).update({
            currentPeriodStart: admin.firestore.Timestamp.fromDate(newPeriodStart),
            currentPeriodEnd: admin.firestore.Timestamp.fromDate(newPeriodEnd),
            updatedAt: admin.firestore.Timestamp.now()
          });

          renewedCount++;
        }
      } catch (error) {
        errorCount++;
        console.error(`Error renovando suscripción ${subscriptionDoc.id}:`, error);
      }
    }

    res.json({
      success: true,
      renewed: renewedCount,
      errors: errorCount,
      total: expiredSubscriptionsQuery.size,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error en renovación manual:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

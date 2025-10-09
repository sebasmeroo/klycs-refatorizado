import * as admin from 'firebase-admin';
import {onDocumentCreated} from 'firebase-functions/v2/firestore';

// Inicializar solo si no está inicializado
if (!admin.apps.length) {
  admin.initializeApp();
}

// Lazy initialization
const getDb = () => admin.firestore();

/**
 * Cloud Function que se dispara cuando se crea una nueva suscripción
 * Envía email de bienvenida según el plan
 *
 * NOTA: Para envío real de emails, integrar con:
 * - SendGrid
 * - AWS SES
 * - Mailgun
 * - O usar Firebase Extensions > Trigger Email
 */
export const sendWelcomeEmail = onDocumentCreated(
  'user_subscriptions/{subscriptionId}',
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const subscription = snapshot.data();

    try {
      const db = getDb();
      // Obtener datos del usuario
      const userDoc = await db.collection('users').doc(subscription.userId).get();

      if (!userDoc.exists) {
        console.error('User not found:', subscription.userId);
        return;
      }

      const user = userDoc.data();
      const userEmail = user?.email || '';
      const userName = user?.name || user?.displayName || 'Usuario';
      const planName = subscription.plan?.name || 'FREE';

      // Generar contenido del email según el plan
      const emailContent = getEmailContent(planName, userName);

      // OPCIÓN 1: Log del email (para desarrollo)
      console.log('📧 Welcome Email:', {
        to: userEmail,
        subject: emailContent.subject,
        body: emailContent.body
      });

      // OPCIÓN 2: Guardar en colección para procesar después
      await db.collection('mail').add({
        to: userEmail,
        message: {
          subject: emailContent.subject,
          text: emailContent.body,
          html: emailContent.html
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'pending',
        userId: subscription.userId,
        planName
      });

      // OPCIÓN 3: Enviar con SendGrid (descomentar cuando se configure)
      /*
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(functions.config().sendgrid.key);

      await sgMail.send({
        to: userEmail,
        from: 'hola@klycs.com',
        subject: emailContent.subject,
        text: emailContent.body,
        html: emailContent.html
      });
      */

      console.log('Welcome email queued successfully for:', userEmail);

    } catch (error) {
      console.error('Error sending welcome email:', error);
    }
  });

/**
 * Generar contenido del email según el plan
 */
function getEmailContent(planName: string, userName: string) {
  const planLower = planName.toLowerCase();

  if (planLower.includes('free')) {
    return {
      subject: '¡Bienvenido a Klycs! 🎉',
      body: `Hola ${userName},

¡Gracias por unirte a Klycs!

Tu cuenta FREE está lista. Puedes:
✅ Crear tu primera tarjeta digital
✅ Personalizar tu perfil básico
✅ Compartir tus enlaces y redes sociales

Para desbloquear calendarios, reservas y más funciones, considera actualizar a PRO.

¡Empecemos!
https://klycs.com/dashboard

El equipo de Klycs`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>¡Bienvenido a Klycs! 🎉</h1>
          <p>Hola <strong>${userName}</strong>,</p>
          <p>¡Gracias por unirte a Klycs!</p>
          <p>Tu cuenta <strong>FREE</strong> está lista. Puedes:</p>
          <ul>
            <li>✅ Crear tu primera tarjeta digital</li>
            <li>✅ Personalizar tu perfil básico</li>
            <li>✅ Compartir tus enlaces y redes sociales</li>
          </ul>
          <p>Para desbloquear calendarios, reservas y más funciones, considera <a href="https://klycs.com/pricing">actualizar a PRO</a>.</p>
          <a href="https://klycs.com/dashboard" style="display: inline-block; background: #007aff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 16px;">
            Empezar ahora
          </a>
          <p style="margin-top: 32px; color: #666;">El equipo de Klycs</p>
        </div>
      `
    };
  }

  if (planLower.includes('pro')) {
    return {
      subject: '¡Bienvenido a Klycs PRO! 🚀',
      body: `Hola ${userName},

¡Gracias por unirte a Klycs PRO!

Tu suscripción está activa. Ahora tienes acceso a:
🎴 1 tarjeta con gestión completa
📅 1 calendario colaborativo
👥 Profesionales ilimitados
💰 Reservas ilimitadas
📊 Analytics completo
🎨 Edición avanzada

¡Saca el máximo provecho de tu plan!
https://klycs.com/dashboard

El equipo de Klycs`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>¡Bienvenido a Klycs PRO! 🚀</h1>
          <p>Hola <strong>${userName}</strong>,</p>
          <p>¡Gracias por unirte a Klycs PRO!</p>
          <p>Tu suscripción está activa. Ahora tienes acceso a:</p>
          <ul>
            <li>🎴 1 tarjeta con gestión completa</li>
            <li>📅 1 calendario colaborativo</li>
            <li>👥 Profesionales ilimitados</li>
            <li>💰 Reservas ilimitadas</li>
            <li>📊 Analytics completo</li>
            <li>🎨 Edición avanzada</li>
          </ul>
          <a href="https://klycs.com/dashboard" style="display: inline-block; background: #007aff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 16px;">
            Ir al Dashboard
          </a>
          <p style="margin-top: 32px; color: #666;">El equipo de Klycs</p>
        </div>
      `
    };
  }

  if (planLower.includes('business')) {
    return {
      subject: '¡Bienvenido a Klycs BUSINESS! 💼',
      body: `Hola ${userName},

¡Gracias por elegir Klycs BUSINESS!

Tu plan empresarial está activo. Tienes acceso total:
🎴 Tarjetas ilimitadas
📅 Calendarios ilimitados
👥 Profesionales ilimitados
🤝 Colaboración avanzada
📊 Analytics con IA
🔗 API + Webhooks
🎨 Custom HTML/CSS/JS
🏷️ White-label completo

Nuestro equipo está listo para ayudarte. Responde este email si necesitas onboarding.

El equipo de Klycs`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>¡Bienvenido a Klycs BUSINESS! 💼</h1>
          <p>Hola <strong>${userName}</strong>,</p>
          <p>¡Gracias por elegir Klycs BUSINESS!</p>
          <p>Tu plan empresarial está activo. Tienes acceso total:</p>
          <ul>
            <li>🎴 Tarjetas ilimitadas</li>
            <li>📅 Calendarios ilimitados</li>
            <li>👥 Profesionales ilimitados</li>
            <li>🤝 Colaboración avanzada</li>
            <li>📊 Analytics con IA</li>
            <li>🔗 API + Webhooks</li>
            <li>🎨 Custom HTML/CSS/JS</li>
            <li>🏷️ White-label completo</li>
          </ul>
          <p>Nuestro equipo está listo para ayudarte. Responde este email si necesitas onboarding.</p>
          <a href="https://klycs.com/dashboard" style="display: inline-block; background: #007aff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 16px;">
            Ir al Dashboard
          </a>
          <p style="margin-top: 32px; color: #666;">El equipo de Klycs</p>
        </div>
      `
    };
  }

  // Fallback
  return {
    subject: '¡Bienvenido a Klycs!',
    body: `Hola ${userName}, ¡Gracias por unirte a Klycs!`,
    html: `<p>Hola <strong>${userName}</strong>, ¡Gracias por unirte a Klycs!</p>`
  };
}

/**
 * Exportar index para poder importar desde functions/index.ts
 */
export default sendWelcomeEmail;

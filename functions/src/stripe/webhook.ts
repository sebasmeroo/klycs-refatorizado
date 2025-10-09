import {onRequest} from 'firebase-functions/v2/https';
import {logger} from 'firebase-functions';
import Stripe from 'stripe';
import {getStripeClient, getStripeWebhookSecret} from './stripeClient';
import {syncSubscription, removeSubscription} from './subscription';

export const handleStripeWebhook = onRequest({cors: true}, async (req, res) => {
  const signature = req.get('stripe-signature');
  const webhookSecret = getStripeWebhookSecret();

  if (!signature || !webhookSecret) {
    logger.error('Missing Stripe webhook signature or secret');
    res.status(400).send('Bad request');
    return;
  }

  const stripe = getStripeClient();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        webhookSecret,
    );
  } catch (error) {
    logger.error('Invalid Stripe webhook signature', {
      error: error instanceof Error ? error.message : error,
    });
    res.status(400).send('Invalid signature');
    return;
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription' && session.subscription) {
          const subscriptionId = typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription.id;
          await syncSubscription(subscriptionId);
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object as Stripe.Subscription;
        await syncSubscription(subscription.id, subscription);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer.id;
        await removeSubscription(subscription.id, customerId);
        break;
      }
      case 'invoice.payment_failed':
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const subscriptionId = typeof invoice.subscription === 'string'
            ? invoice.subscription
            : invoice.subscription.id;
          await syncSubscription(subscriptionId);
        }
        break;
      }
      default:
        logger.info('Unhandled Stripe event', {type: event.type});
    }

    res.json({received: true});
  } catch (error) {
    logger.error('Error handling Stripe webhook', {
      type: event.type,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      eventId: event.id,
    });
    res.status(500).send('Webhook handler failed');
  }
});


import express from 'express';
import Stripe from 'stripe';
import Order from '../model/orderModel.js';
import { getConfig } from '../config/env.js';
import { catchAsync } from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import { connectDatabase } from '../config/database.js';

const router = express.Router();
const config = getConfig();
const stripe = config.stripeSecretKey ? new Stripe(config.stripeSecretKey) : null;

router.post('/stripe', express.raw({ type: 'application/json' }), catchAsync(async (req, res) => {
  await connectDatabase();
  if (!stripe || !config.stripeWebhookSecret) throw new AppError('Stripe webhook is not configured', 503, 'WEBHOOK_UNAVAILABLE');
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.get('stripe-signature'), config.stripeWebhookSecret);
  } catch {
    throw new AppError('Invalid Stripe webhook signature', 400, 'INVALID_WEBHOOK_SIGNATURE');
  }

  const intent = event.data.object;
  if (event.type === 'payment_intent.payment_failed') {
    await Order.updateOne({ paymentIntentId: intent.id }, { $set: { paymentStatus: 'failed' } });
  }
  if (event.type === 'charge.refunded' && intent.payment_intent) {
    await Order.updateOne({ paymentIntentId: intent.payment_intent }, { $set: { paymentStatus: 'refunded' } });
  }
  res.json({ received: true });
}));

export default router;

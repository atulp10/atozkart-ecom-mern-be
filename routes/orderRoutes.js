import express from 'express';
import mongoose from 'mongoose';
import Stripe from 'stripe';
import { randomUUID } from 'node:crypto';
import Order from '../model/orderModel.js';
import Product from '../model/productModel.js';
import { isAuthorized, isLoggedIn } from '../middlewares.js';
import { catchAsync } from '../utils/catchAsync.js';
import { validate } from '../utils/validation.js';
import { orderSchema, orderStatusSchema, paymentIntentSchema } from '../schemas/requests.js';
import { priceItems } from '../services/pricing.js';
import { sendOrderEmail } from '../services/mail.js';
import { getConfig } from '../config/env.js';
import AppError from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

const router = express.Router();
const config = getConfig();
const stripe = config.stripeSecretKey ? new Stripe(config.stripeSecretKey) : null;

const transitions = {
  placed: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['outfordelivery'],
  outfordelivery: ['delivered'],
  delivered: [],
  cancelled: [],
};

async function cancelOrder(order) {
  if (order.paymentMode === 'online' && order.paymentStatus === 'paid') {
    if (!stripe || !order.paymentIntentId) throw new AppError('Payment refund is not configured', 503, 'REFUND_UNAVAILABLE');
    await stripe.refunds.create({ payment_intent: order.paymentIntentId }, { idempotencyKey: `cancel-${order.id}` });
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      for (const item of order.orderedItems) {
        await Product.updateOne({ _id: item.itemId }, { $inc: { stock: item.qty } }, { session });
      }
      order.orderStatus = 'cancelled';
      if (order.paymentMode === 'online') order.paymentStatus = 'refunded';
      await order.save({ session });
    });
  } finally {
    await session.endSession();
  }
}

async function updateOrderStatus(order, orderStatus) {
  if (!transitions[order.orderStatus]?.includes(orderStatus)) {
    throw new AppError('Invalid order status transition', 409, 'INVALID_STATUS_TRANSITION');
  }
  if (orderStatus === 'cancelled') {
    await cancelOrder(order);
    return;
  }
  order.orderStatus = orderStatus;
  if (orderStatus === 'delivered' && order.paymentMode === 'cod') order.paymentStatus = 'paid';
  await order.save();
}

router.get('/', isLoggedIn, catchAsync(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
  const filter = req.user.role === 'Admin' ? {} : { user: req.user._id };
  const orders = await Order.find(filter).sort('-createdAt').skip((page - 1) * limit).limit(limit);
  res.json(orders);
}));

router.get('/:id', isLoggedIn, catchAsync(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404, 'NOT_FOUND');
  if (req.user.role !== 'Admin' && !order.user.equals(req.user._id)) throw new AppError('Order not found', 404, 'NOT_FOUND');
  res.json(order);
}));

export const createPaymentIntent = catchAsync(async (req, res) => {
  if (!stripe) throw new AppError('Online payments are not configured', 503, 'PAYMENTS_UNAVAILABLE');
  const data = validate(paymentIntentSchema, req.body);
  const priced = await priceItems(data.items || data.orderedItems);
  const intent = await stripe.paymentIntents.create({
    amount: Math.round(priced.totalAmount * 100),
    currency: 'usd',
    automatic_payment_methods: { enabled: true },
    metadata: { userId: req.user.id },
  }, { idempotencyKey: req.get('Idempotency-Key') || randomUUID() });
  res.status(201).json({ clientSecret: intent.client_secret, amount: priced.totalAmount });
});

router.post('/payment-intent', isLoggedIn, createPaymentIntent);

router.post('/', isLoggedIn, catchAsync(async (req, res) => {
  const data = validate(orderSchema, req.body);
  const idempotencyKey = req.get('Idempotency-Key') || data.idempotencyKey || data.paymentIntentId;
  if (!idempotencyKey) throw new AppError('Idempotency-Key header is required', 400, 'IDEMPOTENCY_KEY_REQUIRED');

  const existing = await Order.findOne({ idempotencyKey });
  if (existing) return res.status(200).json(existing);

  const session = await mongoose.startSession();
  let createdOrder;
  let verifiedPayment = false;
  try {
    await session.withTransaction(async () => {
      const priced = await priceItems(data.orderedItems, session);
      let paymentStatus = 'unpaid';

      if (data.paymentMode === 'online') {
        if (!stripe || !data.paymentIntentId) throw new AppError('A payment intent is required', 400, 'PAYMENT_REQUIRED');
        const intent = await stripe.paymentIntents.retrieve(data.paymentIntentId);
        if (intent.status !== 'succeeded' || intent.amount_received !== Math.round(priced.totalAmount * 100) || intent.currency !== 'usd' || intent.metadata.userId !== req.user.id) {
          throw new AppError('Payment verification failed', 409, 'PAYMENT_VERIFICATION_FAILED');
        }
        paymentStatus = 'paid';
        verifiedPayment = true;
      }

      for (const item of priced.items) {
        const updated = await Product.findOneAndUpdate(
          { _id: item.itemId, stock: { $gte: item.qty } },
          { $inc: { stock: -item.qty } },
          { new: true, session },
        );
        if (!updated) throw new AppError(`Insufficient stock for ${item.title}`, 409, 'INSUFFICIENT_STOCK');
      }

      [createdOrder] = await Order.create([{
        user: req.user._id,
        email: req.user.email,
        name: req.user.username,
        orderedItems: priced.items,
        subtotal: priced.subtotal,
        shippingAmount: priced.shippingAmount,
        totalAmount: priced.totalAmount,
        shippingAddress: data.shippingAddress,
        paymentMode: data.paymentMode,
        paymentStatus,
        orderStatus: 'placed',
        paymentIntentId: data.paymentIntentId,
        idempotencyKey,
      }], { session });
    });
  } catch (error) {
    if (verifiedPayment && stripe && data.paymentIntentId) {
      try {
        await stripe.refunds.create({ payment_intent: data.paymentIntentId }, { idempotencyKey: `failed-order-${data.paymentIntentId}` });
      } catch (refundError) {
        logger.error('Automatic payment refund failed', { paymentIntentId: data.paymentIntentId, error: refundError.message });
      }
    }
    if (error?.code === 11000) {
      const duplicate = await Order.findOne({ idempotencyKey });
      if (duplicate) return res.status(200).json(duplicate);
    }
    throw error;
  } finally {
    await session.endSession();
  }

  await sendOrderEmail(createdOrder);
  return res.status(201).json(createdOrder);
}));

router.patch('/:id/status', isLoggedIn, isAuthorized, catchAsync(async (req, res) => {
  const { orderStatus } = validate(orderStatusSchema, req.body);
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404, 'NOT_FOUND');
  await updateOrderStatus(order, orderStatus);
  await sendOrderEmail(order);
  res.json(order);
}));

// Compatibility endpoint: only the order status field is accepted.
router.put('/:id', isLoggedIn, isAuthorized, catchAsync(async (req, res) => {
  req.body = { orderStatus: req.body.orderStatus };
  const { orderStatus } = validate(orderStatusSchema, req.body);
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404, 'NOT_FOUND');
  await updateOrderStatus(order, orderStatus);
  await sendOrderEmail(order);
  res.json(order);
}));

export default router;

import mongoose from 'mongoose';
import shippingAddressSchema from './shippingAddressSchema.js';
import orderedItemSchema from './orderedItemSchema.js';

export const ORDER_STATUSES = ['placed', 'confirmed', 'shipped', 'outfordelivery', 'delivered', 'cancelled'];

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  orderedItems: {
    type: [orderedItemSchema],
    required: true,
    validate: [(items) => items.length > 0, 'At least one item is required'],
  },
  subtotal: { type: Number, required: true, min: 0 },
  shippingAmount: { type: Number, required: true, min: 0 },
  totalAmount: { type: Number, required: true, min: 0.01 },
  shippingAddress: { type: shippingAddressSchema, required: true },
  paymentMode: { type: String, enum: ['cod', 'online'], required: true },
  paymentStatus: { type: String, enum: ['unpaid', 'paid', 'failed', 'refunded'], required: true },
  orderStatus: { type: String, enum: ORDER_STATUSES, default: 'placed', required: true },
  paymentIntentId: { type: String, sparse: true, unique: true },
  idempotencyKey: { type: String, required: true, unique: true },
}, { timestamps: true });

orderSchema.virtual('orderDate').get(function orderDate() { return this.createdAt?.toLocaleDateString(); });
orderSchema.virtual('orderTime').get(function orderTime() { return this.createdAt?.toLocaleTimeString(); });
orderSchema.set('toJSON', { virtuals: true });

const Order = mongoose.model('Order', orderSchema);
export default Order;

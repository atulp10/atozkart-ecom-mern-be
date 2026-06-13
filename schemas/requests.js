import { z } from 'zod';
import { PRODUCT_CATEGORIES } from '../model/productModel.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid identifier');
const email = z.string().trim().toLowerCase().email().max(254);

export const registerSchema = z.object({
  username: z.string().trim().regex(/^[A-Za-z0-9_]{3,30}$/),
  email,
  password: z.string().min(8).max(72).regex(/[A-Za-z]/).regex(/\d/),
}).strict();

export const loginSchema = z.object({ email, password: z.string().min(1).max(72) }).strict();

export const productSchema = z.object({
  title: z.string().trim().min(2).max(120),
  price: z.coerce.number().positive().max(10000000),
  category: z.enum(PRODUCT_CATEGORIES),
  stock: z.coerce.number().int().nonnegative(),
  image: z.string().url().max(2048),
  imagePublicId: z.string().trim().max(500).optional(),
  brand: z.string().trim().max(80).default(''),
  description: z.string().trim().max(2000).default(''),
}).strict();

export const productPatchSchema = productSchema.partial().refine((data) => Object.keys(data).length > 0, 'No changes supplied');

export const addressSchema = z.object({
  fullname: z.string().trim().min(1).max(80),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/),
  email,
  addressline1: z.string().trim().min(1).max(150),
  addressline2: z.string().trim().max(150).default(''),
  area: z.string().trim().min(1).max(80),
  city: z.string().trim().min(1).max(80),
  pincode: z.string().trim().regex(/^\d{6}$/),
  state: z.string().trim().min(1).max(80),
}).strict();

export const orderSchema = z.object({
  orderedItems: z.array(z.object({
    itemId: objectId,
    qty: z.coerce.number().int().positive().max(100),
  }).passthrough()).min(1).max(50),
  shippingAddress: addressSchema,
  paymentMode: z.enum(['cod', 'online']),
  paymentIntentId: z.string().trim().min(1).max(255).optional(),
  idempotencyKey: z.string().trim().min(8).max(255).optional(),
}).passthrough();

export const paymentIntentSchema = z.object({
  items: z.array(z.object({ itemId: objectId, qty: z.coerce.number().int().positive().max(100) }).passthrough()).min(1).max(50).optional(),
  orderedItems: z.array(z.object({ itemId: objectId, qty: z.coerce.number().int().positive().max(100) }).passthrough()).min(1).max(50).optional(),
}).passthrough().refine((data) => data.items || data.orderedItems, 'Items are required');

export const orderStatusSchema = z.object({
  orderStatus: z.enum(['confirmed', 'shipped', 'outfordelivery', 'delivered', 'cancelled']),
}).strict();

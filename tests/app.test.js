import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

const origin = 'http://localhost:5173';
let replset;
let app;
let User;
let Product;
let Order;

beforeAll(async () => {
  replset = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  process.env.NODE_ENV = 'test';
  process.env.DB_URL = replset.getUri();
  process.env.SESSION_SECRET = 'test-session-secret-with-enough-length';
  process.env.ALLOWED_ORIGINS = origin;
  ({ default: app } = await import('../app.js'));
  ({ default: User } = await import('../model/userModel.js'));
  ({ default: Product } = await import('../model/productModel.js'));
  ({ default: Order } = await import('../model/orderModel.js'));
});

afterAll(async () => {
  const { disconnectDatabase } = await import('../config/database.js');
  await disconnectDatabase();
  await replset.stop();
});

async function register(agent, email, username = 'shopper_1') {
  return agent.post('/users/register').set('Origin', origin).send({ email, username, password: 'Password123', role: 'Admin' });
}

describe('authentication and authorization', () => {
  it('does not accept public role escalation or expose password fields', async () => {
    const agent = request.agent(app);
    const response = await register(agent, 'user1@example.com');
    expect(response.status).toBe(400);

    const valid = await agent.post('/users/register').set('Origin', origin).send({ email: 'user1@example.com', username: 'shopper_1', password: 'Password123' });
    expect(valid.status).toBe(201);
    expect(valid.body).toMatchObject({ email: 'user1@example.com', role: 'User' });
    expect(valid.body).not.toHaveProperty('hash');
    expect(valid.body).not.toHaveProperty('salt');
  });

  it('allows only admins to create products', async () => {
    const userAgent = request.agent(app);
    await userAgent.post('/users/register').set('Origin', origin).send({ email: 'user2@example.com', username: 'shopper_2', password: 'Password123' });
    const product = { title: 'Desk Lamp', price: 15, category: 'Home', stock: 5, image: 'https://example.com/lamp.jpg', brand: 'Bright', description: '' };
    expect((await userAgent.post('/products').set('Origin', origin).send(product)).status).toBe(403);

    const admin = await User.register(new User({ email: 'admin@example.com', username: 'admin_user', role: 'Admin' }), 'Password123');
    expect(admin.role).toBe('Admin');
    const adminAgent = request.agent(app);
    await adminAgent.post('/users/login').set('Origin', origin).send({ email: 'admin@example.com', password: 'Password123' });
    expect((await adminAgent.post('/products').set('Origin', origin).send(product)).status).toBe(201);
  });
});

describe('orders', () => {
  it('prices orders on the server, decrements stock, and handles retries idempotently', async () => {
    const agent = request.agent(app);
    await agent.post('/users/register').set('Origin', origin).send({ email: 'buyer@example.com', username: 'buyer_user', password: 'Password123' });
    const product = await Product.create({ title: 'Book', price: 10, category: 'Books', stock: 4, image: 'https://example.com/book.jpg' });
    const payload = {
      orderedItems: [{ itemId: product.id, qty: 2, price: 0.01 }],
      shippingAddress: { fullname: 'Buyer User', phone: '9876543210', email: 'buyer@example.com', addressline1: '1 Main Road', addressline2: '', area: 'Center', city: 'Pune', pincode: '411001', state: 'Maharashtra' },
      paymentMode: 'cod',
      totalAmount: 0.01,
    };

    const first = await agent.post('/orders').set('Origin', origin).set('Idempotency-Key', 'order-test-0001').send(payload);
    expect(first.status).toBe(201);
    expect(first.body).toMatchObject({ subtotal: 20, shippingAmount: 0, totalAmount: 20, paymentStatus: 'unpaid' });
    expect((await Product.findById(product.id)).stock).toBe(2);

    const retry = await agent.post('/orders').set('Origin', origin).set('Idempotency-Key', 'order-test-0001').send(payload);
    expect(retry.status).toBe(200);
    expect(await Order.countDocuments({ idempotencyKey: 'order-test-0001' })).toBe(1);
    expect((await Product.findById(product.id)).stock).toBe(2);
  });

  it('returns only the authenticated user orders', async () => {
    const otherAgent = request.agent(app);
    await otherAgent.post('/users/register').set('Origin', origin).send({ email: 'other@example.com', username: 'other_user', password: 'Password123' });
    const response = await otherAgent.get('/orders');
    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('combines duplicate cart lines before checking and decrementing stock', async () => {
    const agent = request.agent(app);
    await agent.post('/users/register').set('Origin', origin).send({ email: 'duplicate@example.com', username: 'duplicate_user', password: 'Password123' });
    const product = await Product.create({ title: 'Pen', price: 2.5, category: 'Art & Craft', stock: 5, image: 'https://example.com/pen.jpg' });
    const response = await agent.post('/orders').set('Origin', origin).set('Idempotency-Key', 'order-test-duplicate').send({
      orderedItems: [{ itemId: product.id, qty: 2 }, { itemId: product.id, qty: 2 }],
      shippingAddress: { fullname: 'Duplicate User', phone: '9876543210', email: 'duplicate@example.com', addressline1: '2 Main Road', addressline2: '', area: 'Center', city: 'Pune', pincode: '411001', state: 'Maharashtra' },
      paymentMode: 'cod',
    });
    expect(response.status).toBe(201);
    expect(response.body.orderedItems).toHaveLength(1);
    expect(response.body.orderedItems[0].qty).toBe(4);
    expect((await Product.findById(product.id)).stock).toBe(1);
  });
});

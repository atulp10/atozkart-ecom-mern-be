import { describe, expect, it } from 'vitest';
import { productSchema, registerSchema } from '../schemas/requests.js';

describe('request validation', () => {
  it('rejects role assignment during registration', () => {
    expect(registerSchema.safeParse({ email: 'a@example.com', username: 'valid_user', password: 'Password123', role: 'Admin' }).success).toBe(false);
  });

  it('rejects negative or fractional stock', () => {
    const base = { title: 'Item', price: 10, category: 'Home', image: 'https://example.com/item.jpg', brand: '', description: '' };
    expect(productSchema.safeParse({ ...base, stock: -1 }).success).toBe(false);
    expect(productSchema.safeParse({ ...base, stock: 1.5 }).success).toBe(false);
  });
});

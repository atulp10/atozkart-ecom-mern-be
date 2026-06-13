import { afterEach, describe, expect, it } from 'vitest';
import { getConfig } from '../config/env.js';

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

function setProductionEnv() {
  Object.assign(process.env, {
    NODE_ENV: 'production',
    DB_URL: 'mongodb://example.test/atozkart',
    SESSION_SECRET: 'a-long-production-session-secret',
    STRIPE_SECRET_KEY: 'sk_test_example',
    EMAIL: 'store@example.com',
    PWD: 'email-password',
    CLOUDINARY_CLOUD_NAME: 'example',
    CLOUDINARY_KEY: 'key',
    CLOUDINARY_SECRET: 'secret',
  });
  delete process.env.STRIPE_WEBHOOK_SECRET;
}

describe('production environment validation', () => {
  it('allows the API to start without Stripe webhook support', () => {
    setProductionEnv();
    expect(getConfig().stripeWebhookSecret).toBe('');
  });

  it('still requires a production session secret', () => {
    setProductionEnv();
    delete process.env.SESSION_SECRET;
    expect(() => getConfig()).toThrow(/SESSION_SECRET/);
  });
});

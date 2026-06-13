const requiredInProduction = [
  'DB_URL',
  'SESSION_SECRET',
  'STRIPE_SECRET_KEY',
  'EMAIL',
  'PWD',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_KEY',
  'CLOUDINARY_SECRET',
];

export function getConfig() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const missing = requiredInProduction.filter((key) => !process.env[key]);
  if (nodeEnv === 'production' && missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return {
    nodeEnv,
    isProduction: nodeEnv === 'production',
    port: Number(process.env.PORT) || 8080,
    dbUrl: process.env.DB_URL || 'mongodb://127.0.0.1:27017/atozkart',
    sessionSecret: process.env.SESSION_SECRET || 'development-only-change-me',
    sessionName: process.env.SESSION_NAME || 'atozkart.sid',
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    emailUser: process.env.EMAIL || '',
    emailPassword: process.env.PWD || '',
    cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    cloudinaryKey: process.env.CLOUDINARY_KEY || '',
    cloudinarySecret: process.env.CLOUDINARY_SECRET || '',
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,https://atozkart.vercel.app')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
  };
}

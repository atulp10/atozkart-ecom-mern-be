import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import passport from 'passport';
import MongoStore from 'connect-mongo';
import mongoose from 'mongoose';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import { createPaymentIntent } from './routes/orderRoutes.js';
import userRoutes from './routes/userRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import User from './model/userModel.js';
import { connectDatabase } from './config/database.js';
import { getConfig } from './config/env.js';
import { apiLimiter, requireTrustedOrigin } from './middlewares/security.js';
import { errorHandler, notFound } from './middlewares/errors.js';
import { logger } from './utils/logger.js';
import { isLoggedIn } from './middlewares.js';
import AppError from './utils/AppError.js';

const config = getConfig();
const app = express();

mongoose.set('strictQuery', true);

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use((req, res, next) => {
  const cloudfrontProto = req.headers['cloudfront-forwarded-proto'];
  if (cloudfrontProto && !req.headers['x-forwarded-proto']) {
    req.headers['x-forwarded-proto'] = cloudfrontProto;
  }
  next();
});
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || config.allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new AppError('Origin is not allowed by CORS', 403, 'ORIGIN_NOT_ALLOWED'));
  },
  credentials: true,
}));
app.use('/webhooks', webhookRoutes);
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use(apiLimiter);
app.use(requireTrustedOrigin);
app.get('/', (req, res) => res.json({ name: 'AtoZKart API', status: 'ok', deployment: 'github-actions' }));
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/ready', (req, res) => res.status(mongoose.connection.readyState === 1 ? 200 : 503).json({ database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));
app.get('/debug/headers', (req, res) => {
  res.json({
    secure: req.secure,
    protocol: req.protocol,
    host: req.headers.host,
    origin: req.headers.origin || null,
    forwardedProto: req.headers['x-forwarded-proto'] || null,
    cloudfrontForwardedProto: req.headers['cloudfront-forwarded-proto'] || null,
    forwardedFor: req.headers['x-forwarded-for'] || null,
    cookie: req.headers.cookie || null,
  });
});
app.use(catchDatabaseConnection);

const sessionOptions = {
  name: config.sessionName,
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  },
};

if (config.nodeEnv !== 'test') {
  sessionOptions.store = MongoStore.create({ mongoUrl: config.dbUrl, touchAfter: 24 * 60 * 60, crypto: { secret: config.sessionSecret } });
}

app.use(session(sessionOptions));
app.use(passport.initialize());
app.use(passport.session());
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  const started = Date.now();
  res.on('finish', () => logger.info('request', { method: req.method, path: req.originalUrl, status: res.statusCode, durationMs: Date.now() - started, userId: req.user?.id }));
  next();
});

app.use('/users', userRoutes);
app.use('/products', productRoutes);
app.use('/orders', orderRoutes);

app.post('/create-payment-intent', isLoggedIn, createPaymentIntent);

app.use(notFound);
app.use(errorHandler);

async function catchDatabaseConnection(req, res, next) {
  try {
    await connectDatabase();
    next();
  } catch (error) {
    next(error);
  }
}

export default app;

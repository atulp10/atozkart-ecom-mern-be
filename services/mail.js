import nodemailer from 'nodemailer';
import { getConfig } from '../config/env.js';
import { logger } from '../utils/logger.js';

let transporter;

function getTransporter() {
  if (!transporter) {
    const config = getConfig();
    if (!config.emailUser || !config.emailPassword) return null;
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: { user: config.emailUser, pass: config.emailPassword },
    });
  }
  return transporter;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

export async function sendOrderEmail(order) {
  const mailer = getTransporter();
  if (!mailer) return;
  try {
    const config = getConfig();
    await mailer.sendMail({
      from: `AtoZKart <${config.emailUser}>`,
      to: order.email,
      subject: `Your AtoZKart order is ${order.orderStatus}`,
      text: `Hello ${order.name}, your order ${order.id} is ${order.orderStatus}. Total: ${order.totalAmount}.`,
      html: `<p>Hello ${escapeHtml(order.name)},</p><p>Your order <strong>${escapeHtml(order.id)}</strong> is ${escapeHtml(order.orderStatus)}.</p><p>Total: $${Number(order.totalAmount).toFixed(2)}</p>`,
    });
  } catch (error) {
    logger.error('Order email failed', { orderId: order.id, error: error.message });
  }
}

import { Router } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import Order from '../models/Order.js';
import { sendMail } from '../config/email.js';
import { orderConfirmationEmail } from '../utils/emailTemplates.js';

const router = Router();

function verifyPaddleSignature(rawBody, signatureHeader, secret) {
  // Trim whitespace pasted into Render's env var UI so a trailing space
  // doesn't silently fail every webhook.
  const cleanSecret = secret?.trim();
  if (!cleanSecret || cleanSecret === 'replace_me') return process.env.NODE_ENV !== 'production';
  if (!signatureHeader || !Buffer.isBuffer(rawBody)) return false;

  const parts = signatureHeader.split(';').map(part => part.split('='));
  const timestamp = parts.find(([key]) => key === 'ts')?.[1];
  const signatures = parts.filter(([key]) => key === 'h1').map(([, value]) => value);
  if (!timestamp || signatures.length === 0) return false;

  const signedPayload = `${timestamp}:${rawBody.toString('utf8')}`;
  const expected = createHmac('sha256', cleanSecret).update(signedPayload).digest('hex');
  const expectedBuffer = Buffer.from(expected, 'hex');

  return signatures.some(signature => {
    const signatureBuffer = Buffer.from(signature, 'hex');
    return signatureBuffer.length === expectedBuffer.length && timingSafeEqual(signatureBuffer, expectedBuffer);
  });
}

async function sendConfirmation(order) {
  if (order.confirmationSent) return;

  const email = orderConfirmationEmail({
    customerName: order.customerName,
    publicSlug: order.publicSlug,
    editToken: order.editToken,
    weddingDetails: order.weddingDetails,
  });

  try {
    await sendMail({ to: order.customerEmail, ...email });
    order.confirmationSent = true;
    await order.save();
  } catch (emailErr) {
    console.error('Failed to send confirmation email:', emailErr.message);
  }
}

router.post('/paddle', async (req, res) => {
  try {
    const rawBody = req.body;
    const isValid = verifyPaddleSignature(
      rawBody,
      req.headers['paddle-signature'],
      process.env.PADDLE_WEBHOOK_SECRET
    );

    if (!isValid) {
      const hasSecret = !!process.env.PADDLE_WEBHOOK_SECRET?.trim();
      console.error(`Paddle webhook signature invalid (secret configured: ${hasSecret}) — copy the exact "Endpoint Secret Key" from Paddle Notifications into PADDLE_WEBHOOK_SECRET.`);
      return res.status(403).json({ error: 'Invalid signature' });
    }

    const event = JSON.parse(rawBody.toString('utf8'));
    const payload = event.data || {};
    const orderId = payload.custom_data?.orderId || payload.custom_data?.order_id;

    switch (event.event_type) {
      case 'transaction.completed':
      case 'transaction.paid': {
        if (!orderId) break;
        const order = await Order.findById(orderId);
        if (order) {
          order.paymentProvider = 'paddle';
          order.paddleTransactionId = payload.id;
          order.amountPaid = process.env.PRICE_USD || order.amountPaid || '89.00';
          order.currency = payload.currency_code || order.currency || 'USD';
          if (order.paymentStatus !== 'paid') {
            await order.activate();
          }
          await sendConfirmation(order);
        }
        break;
      }

      case 'transaction.payment_failed':
      case 'transaction.canceled': {
        if (!orderId) break;
        const order = await Order.findById(orderId);
        if (order && order.paymentStatus !== 'paid') {
          order.paymentProvider = 'paddle';
          order.paddleTransactionId = payload.id;
          order.paymentStatus = 'failed';
          await order.save();
        }
        break;
      }

      case 'adjustment.created':
      case 'adjustment.updated': {
        const transactionId = payload.transaction_id;
        const order = transactionId ? await Order.findOne({ paddleTransactionId: transactionId }) : null;
        if (order && payload.action === 'refund' && ['approved', 'completed'].includes(payload.status)) {
          order.paymentStatus = 'refunded';
          order.status = 'cancelled';
          await order.save();
        }
        break;
      }

      default:
        break;
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Paddle webhook error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

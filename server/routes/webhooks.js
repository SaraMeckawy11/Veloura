import { Router } from 'express';
import crypto from 'crypto';
import Order from '../models/Order.js';
import { sendMail } from '../config/email.js';
import { orderConfirmationEmail } from '../utils/emailTemplates.js';

const router = Router();

/**
 * Verify Paymob HMAC signature
 * Paymob sends a callback with transaction data + hmac query param.
 * We must concatenate specific fields in order and hash with HMAC_SECRET.
 */
function verifyHmac(obj, hmac) {
  const keys = [
    'amount_cents',
    'created_at',
    'currency',
    'error_occured',
    'has_parent_transaction',
    'id',
    'integration_id',
    'is_3d_secure',
    'is_auth',
    'is_capture',
    'is_refunded',
    'is_standalone_payment',
    'is_voided',
    'order',
    'owner',
    'pending',
    'source_data.pan',
    'source_data.sub_type',
    'source_data.type',
    'success',
  ];

  const getValue = (path) => {
    const parts = path.split('.');
    let val = obj;
    for (const p of parts) {
      val = val?.[p];
    }
    return val ?? '';
  };

  const concatenated = keys.map(k => String(getValue(k))).join('');

  const hash = crypto
    .createHmac('sha512', process.env.PAYMOB_HMAC_SECRET)
    .update(concatenated)
    .digest('hex');

  return hash === hmac;
}

// POST /api/webhooks/paymob — Paymob transaction callback
router.post('/paymob', async (req, res) => {
  try {
    const { obj, hmac } = req.body;

    if (!obj || !hmac) {
      // Paymob sometimes sends via query params on GET callback
      return res.status(400).json({ error: 'Missing callback data' });
    }

    // Verify HMAC
    if (!verifyHmac(obj, hmac)) {
      console.error('Paymob HMAC verification failed');
      return res.status(403).json({ error: 'Invalid HMAC' });
    }

    const paymobOrderId = String(obj.order);
    const order = await Order.findOne({ paymobOrderId });

    if (!order) {
      console.error('Order not found for Paymob order:', paymobOrderId);
      return res.status(404).json({ error: 'Order not found' });
    }

    if (obj.success === true || obj.success === 'true') {
      // Payment succeeded
      if (order.paymentStatus !== 'paid') {
        order.paymobTransactionId = String(obj.id);
        order.amountPaid = obj.amount_cents;
        await order.activate();

        // Send confirmation email
        if (!order.confirmationSent) {
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
      }
    } else {
      // Payment failed
      order.paymentStatus = 'failed';
      order.paymobTransactionId = String(obj.id);
      await order.save();
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/webhooks/paymob/callback — Paymob redirect callback (browser redirect after payment)
router.get('/paymob/callback', async (req, res) => {
  const { success, order: paymobOrderId, hmac } = req.query;

  const dbOrder = await Order.findOne({ paymobOrderId: String(paymobOrderId) });
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  if (dbOrder && (success === 'true')) {
    res.redirect(`${clientUrl}/order/success/${dbOrder._id}`);
  } else if (dbOrder) {
    res.redirect(`${clientUrl}/order/failed/${dbOrder._id}`);
  } else {
    res.redirect(`${clientUrl}/order/failed`);
  }
});

export default router;

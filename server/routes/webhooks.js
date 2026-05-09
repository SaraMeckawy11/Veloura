import { Router } from 'express';
import Order from '../models/Order.js';
import { sendMail } from '../config/email.js';
import { orderConfirmationEmail } from '../utils/emailTemplates.js';
import { verifyPaypalWebhook } from '../config/paypal.js';

const router = Router();

async function sendConfirmation(order) {
  if (order.confirmationSent) return;

  const email = orderConfirmationEmail({
    customerName: order.customerName,
    publicSlug: order.publicSlug,
    editToken: order.editToken,
    weddingDetails: order.weddingDetails,
    invitationCode: order.invitationCode,
  });

  try {
    await sendMail({ to: order.customerEmail, ...email });
    order.confirmationSent = true;
    await order.save();
  } catch (emailErr) {
    console.error('Failed to send confirmation email:', emailErr.message);
  }
}

// PayPal puts the orderId in custom_id (we set it in createPaypalOrder).
// Falls back to the supplemental_data link or invoice_id if needed.
function resolveOrderIdFromResource(resource) {
  if (!resource) return null;
  if (resource.custom_id) return resource.custom_id;
  if (resource.invoice_id) return resource.invoice_id;
  // For CHECKOUT.ORDER.* events, custom_id is on purchase_units[0]
  const pu = resource.purchase_units?.[0];
  if (pu?.custom_id) return pu.custom_id;
  if (pu?.reference_id) return pu.reference_id;
  return null;
}

router.post('/paypal', async (req, res) => {
  try {
    const rawBody = req.body;
    const isValid = await verifyPaypalWebhook(req.headers, rawBody);

    if (!isValid) {
      const hasWebhookId = !!process.env.PAYPAL_WEBHOOK_ID?.trim();
      console.error(`PayPal webhook signature invalid (webhook id configured: ${hasWebhookId}) — copy the Webhook ID from PayPal Developer Dashboard into PAYPAL_WEBHOOK_ID.`);
      return res.status(403).json({ error: 'Invalid signature' });
    }

    const event = JSON.parse(rawBody.toString('utf8'));
    const resource = event.resource || {};
    const orderId = resolveOrderIdFromResource(resource);

    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED': {
        if (!orderId) break;
        const order = await Order.findById(orderId);
        if (order) {
          order.paymentProvider = 'paypal';
          order.paypalCaptureId = resource.id || order.paypalCaptureId;
          if (resource.supplementary_data?.related_ids?.order_id) {
            order.paypalOrderId = resource.supplementary_data.related_ids.order_id;
          }
          order.amountPaid = resource.amount?.value || process.env.PRICE_USD || order.amountPaid || '89.00';
          order.currency = resource.amount?.currency_code || order.currency || 'USD';
          if (order.paymentStatus !== 'paid') {
            await order.activate();
          }
          await sendConfirmation(order);
        }
        break;
      }

      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.DECLINED':
      case 'CHECKOUT.ORDER.VOIDED': {
        if (!orderId) break;
        const order = await Order.findById(orderId);
        if (order && order.paymentStatus !== 'paid') {
          order.paymentProvider = 'paypal';
          if (resource.id) order.paypalCaptureId = resource.id;
          order.paymentStatus = 'failed';
          await order.save();
        }
        break;
      }

      case 'PAYMENT.CAPTURE.REFUNDED':
      case 'PAYMENT.CAPTURE.REVERSED': {
        // For refund events PayPal puts the original capture id in links[].href
        // (capture); custom_id may be missing. Look up by capture id if needed.
        let order = orderId ? await Order.findById(orderId) : null;
        if (!order && resource.id) {
          // resource.id here is the refund id — not useful. Try links rel="up".
          const captureLink = (resource.links || []).find(l => l.rel === 'up');
          const captureId = captureLink?.href?.split('/')?.pop();
          if (captureId) order = await Order.findOne({ paypalCaptureId: captureId });
        }
        if (order) {
          order.paymentStatus = 'refunded';
          order.status = 'cancelled';
          await order.save();
        }
        break;
      }

      case 'CHECKOUT.ORDER.APPROVED':
      default:
        break;
    }

    res.json({ received: true });
  } catch (err) {
    console.error('PayPal webhook error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

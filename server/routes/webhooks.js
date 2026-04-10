import { Router } from 'express';
import Order from '../models/Order.js';
import { capturePayPalOrder, verifyWebhookSignature } from '../config/paypal.js';
import { sendMail } from '../config/email.js';
import { orderConfirmationEmail } from '../utils/emailTemplates.js';

const router = Router();

/**
 * After customer approves on PayPal, they are redirected here.
 * We capture the payment and redirect to the frontend success page.
 */
router.get('/paypal/success', async (req, res) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  try {
    const { token: paypalOrderId } = req.query; // PayPal sends ?token=PAYPAL_ORDER_ID

    if (!paypalOrderId) {
      return res.redirect(`${clientUrl}/order/failed`);
    }

    // Find our order
    const order = await Order.findOne({ paypalOrderId });
    if (!order) {
      return res.redirect(`${clientUrl}/order/failed`);
    }

    // Capture the payment
    const capture = await capturePayPalOrder(paypalOrderId);

    if (capture.status === 'COMPLETED') {
      const captureData = capture.purchase_units?.[0]?.payments?.captures?.[0];

      order.paypalCaptureId = captureData?.id || '';
      order.amountPaid = captureData?.amount?.value || process.env.PRICE_USD;
      order.currency = captureData?.amount?.currency_code || 'USD';
      await order.activate(); // sets status=active, paymentStatus=paid, expiresAt=+1year

      // Send confirmation email
      if (!order.confirmationSent) {
        const email = orderConfirmationEmail({
          customerName: order.customerName,
          publicSlug: order.publicSlug,
          editToken: order.editToken,
          weddingDetails: order.weddingDetails,
          invitationCode: order.publicSlug,
        });

        try {
          await sendMail({ to: order.customerEmail, ...email });
          order.confirmationSent = true;
          await order.save();
        } catch (emailErr) {
          console.error('Failed to send confirmation email:', emailErr.message);
        }
      }

      return res.redirect(`${clientUrl}/order/success/${order._id}`);
    } else {
      order.paymentStatus = 'failed';
      await order.save();
      return res.redirect(`${clientUrl}/order/failed/${order._id}`);
    }
  } catch (err) {
    console.error('PayPal capture error:', err);
    return res.redirect(`${clientUrl}/order/failed`);
  }
});

/**
 * PayPal webhook for async events (refunds, disputes, etc.)
 * Set this URL in PayPal Developer Dashboard → Webhooks
 */
router.post('/paypal', async (req, res) => {
  try {
    // Verify signature if webhook ID is configured
    if (process.env.PAYPAL_WEBHOOK_ID) {
      const isValid = await verifyWebhookSignature({
        headers: req.headers,
        body: req.body,
        webhookId: process.env.PAYPAL_WEBHOOK_ID,
      });
      if (!isValid) {
        console.error('PayPal webhook signature invalid');
        return res.status(403).json({ error: 'Invalid signature' });
      }
    }

    const event = req.body;

    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.REFUNDED': {
        const captureId = event.resource?.id;
        const order = await Order.findOne({ paypalCaptureId: captureId });
        if (order) {
          order.paymentStatus = 'refunded';
          order.status = 'cancelled';
          await order.save();
        }
        break;
      }

      case 'PAYMENT.CAPTURE.REVERSED': {
        const captureId = event.resource?.links?.find(l => l.rel === 'up')?.href?.split('/').pop();
        const order = await Order.findOne({ paypalCaptureId: captureId });
        if (order) {
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
    console.error('PayPal webhook error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

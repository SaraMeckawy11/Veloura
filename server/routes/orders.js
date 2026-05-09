import { Router } from 'express';
import Order from '../models/Order.js';
import Template from '../models/Template.js';
import User from '../models/User.js';
import { sendMail } from '../config/email.js';
import { orderConfirmationEmail, editLimitWarningEmail, sensitiveFieldChangeEmail } from '../utils/emailTemplates.js';
import { validateOrderBody, validateEditToken } from '../middleware/validateOrder.js';
import { getFallbackTemplate } from '../data/templateFallbacks.js';
import {
  paypalApiConfigured,
  createPaypalOrder,
  capturePaypalOrder,
  getPaypalOrder,
  extractCaptureDetails,
} from '../config/paypal.js';
import { getClientUrl } from '../config/urls.js';

const router = Router();

const PRICE_USD = process.env.PRICE_USD || '89.00';
const CURRENCY = process.env.PRICE_CURRENCY || 'USD';
const CLIENT_URL = getClientUrl();

// POST /api/orders - create order + PayPal order. Refuses with 503 if PayPal credentials are missing.
router.post('/', validateOrderBody, async (req, res) => {
  try {
    const { customerName, customerEmail, customerPhone, templateId, weddingDetails, customizations, disabledFields, colorOverrides, photos, musicUrl, musicPublicId, musicEnabled, storyMilestones } = req.body;

    let template = null;
    if (templateId?.match?.(/^[a-f\d]{24}$/i)) {
      template = await Template.findById(templateId);
    }
    if (!template) {
      template = await Template.findOne({ slug: templateId, active: true });
    }
    if (!template) {
      const fallback = getFallbackTemplate(templateId);
      if (fallback) {
        template = await Template.findOneAndUpdate(
          { slug: fallback.slug },
          { $setOnInsert: fallback },
          { new: true, upsert: true }
        );
      }
    }
    if (!template) return res.status(404).json({ error: 'Template not found' });

    // Create order in draft state
    const order = new Order({
      customerName,
      customerEmail,
      template: template._id,
      weddingDetails,
      customizations: customizations || {},
      disabledFields: disabledFields || [],
      colorOverrides: colorOverrides || {},
      photos: photos || [],
      musicUrl,
      musicPublicId,
      musicEnabled: musicEnabled !== undefined ? musicEnabled : Boolean(musicUrl),
      storyMilestones: storyMilestones || [],
    });
    await order.save();

    // Find or create User
    let user = await User.findOne({ email: customerEmail.toLowerCase() });
    if (!user) {
      user = new User({
        name: customerName,
        email: customerEmail,
        phone: customerPhone || '',
      });
      await user.save();
    }
    if (!user.orders.includes(order._id)) {
      user.orders.push(order._id);
      await user.save();
    }

    if (!paypalApiConfigured()) {
      console.error(`[paypal] order creation refused — PAYPAL_CLIENT_ID/SECRET not set on server. orderId=${order._id}`);
      return res.status(503).json({
        error: 'Payment system is not configured. Please contact support.',
      });
    }

    try {
      const paypalOrder = await createPaypalOrder({
        orderId: order._id.toString(),
        amount: PRICE_USD,
        currency: CURRENCY,
      });
      order.paymentProvider = 'paypal';
      order.paypalOrderId = paypalOrder.id;
      order.amountPaid = PRICE_USD;
      order.currency = CURRENCY;
      await order.save();
      console.log(`[paypal] order created orderId=${order._id} paypalOrderId=${paypalOrder.id} amount=${PRICE_USD} ${CURRENCY}`);
      return res.status(201).json({
        orderId: order._id,
        paymentProvider: 'paypal',
        paypal: {
          clientId: process.env.PAYPAL_CLIENT_ID,
          environment: process.env.PAYPAL_ENVIRONMENT === 'live' ? 'live' : 'sandbox',
          paypalOrderId: paypalOrder.id,
          currency: CURRENCY,
          successUrl: `${CLIENT_URL}/order/success/${order._id}`,
        },
      });
    } catch (paypalErr) {
      console.error(`[paypal] order creation failed orderId=${order._id}:`, paypalErr.message, paypalErr.data);
      return res.status(502).json({ error: paypalErr.message || 'Could not create PayPal order' });
    }
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// The legacy /confirm/:orderId endpoint that activated orders without payment
// has been removed. All payments must go through PayPal capture.

// Shared helper: mark an order paid using a captured PayPal order, then send the confirmation email.
async function activateFromCapture(order, paypalOrder) {
  const details = extractCaptureDetails(paypalOrder);
  if (!details || details.status !== 'COMPLETED') {
    console.warn(`[paypal] activateFromCapture skipped: orderId=${order._id} paypalStatus=${paypalOrder?.status} captureStatus=${details?.status}`);
    return false;
  }

  order.paypalOrderId = paypalOrder.id || order.paypalOrderId;
  order.paypalCaptureId = details.captureId || order.paypalCaptureId;
  order.amountPaid = details.amount || order.amountPaid || PRICE_USD;
  order.currency = details.currency || order.currency || CURRENCY;
  if (order.paymentStatus !== 'paid') {
    await order.activate();
    console.log(`[paypal] activated orderId=${order._id} captureId=${details.captureId} amount=${details.amount} ${details.currency}`);
  }

  if (!order.confirmationSent) {
    try {
      const email = orderConfirmationEmail({
        customerName: order.customerName,
        publicSlug: order.publicSlug,
        editToken: order.editToken,
        weddingDetails: order.weddingDetails,
        isPending: false,
        invitationCode: order.invitationCode,
      });
      await sendMail({ to: order.customerEmail, ...email });
      order.confirmationSent = true;
      await order.save();
      console.log(`[paypal] confirmation email sent orderId=${order._id} to=${order.customerEmail}`);
    } catch (emailErr) {
      console.error(`[paypal] confirmation email failed orderId=${order._id} to=${order.customerEmail}:`, emailErr.message);
    }
  }
  return true;
}

// POST /api/orders/capture/:orderId — called by the PayPal SDK onApprove handler.
// Performs the server-side capture (do not trust client-side completion alone) and
// activates the order. Webhook PAYMENT.CAPTURE.COMPLETED still runs as a redundant safety net.
router.post('/capture/:orderId', async (req, res) => {
  console.log(`[paypal] capture request orderId=${req.params.orderId}`);
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      console.warn(`[paypal] capture: order not found orderId=${req.params.orderId}`);
      return res.status(404).json({ error: 'Order not found' });
    }
    if (!order.paypalOrderId) {
      console.warn(`[paypal] capture: no paypalOrderId on order ${order._id}`);
      return res.status(400).json({ error: 'No PayPal order linked to this order' });
    }

    if (order.paymentStatus === 'paid') {
      console.log(`[paypal] capture: order ${order._id} already paid, returning success`);
      return res.json({
        message: 'Already paid',
        orderId: order._id,
        publicSlug: order.publicSlug,
        editToken: order.editToken,
      });
    }

    let captured;
    try {
      captured = await capturePaypalOrder(order.paypalOrderId);
      console.log(`[paypal] capture API ok orderId=${order._id} paypalOrderId=${order.paypalOrderId} status=${captured?.status}`);
    } catch (captureErr) {
      const issue = captureErr.data?.details?.[0]?.issue;
      const description = captureErr.data?.details?.[0]?.description;
      const complianceBlocked = issue === 'COMPLIANCE_VIOLATION'
        || /compliance violation/i.test(description || captureErr.message || '');
      console.error(`[paypal] capture API failed orderId=${order._id} status=${captureErr.status} issue=${issue} description=${description} body=${JSON.stringify(captureErr.data)}`);

      // Webhook may have beaten us — only on this specific issue do we treat as success.
      if (issue === 'ORDER_ALREADY_CAPTURED') {
        captured = await getPaypalOrder(order.paypalOrderId);
      } else {
        // Translate PayPal's machine codes into user-actionable messages.
        const userMessage = (
          issue === 'ORDER_NOT_APPROVED'
            ? 'PayPal could not complete the payment because the buyer did not approve it. Please try again — make sure to click "Pay Now" inside the PayPal popup before it closes.'
          : complianceBlocked
            ? 'PayPal blocked this sandbox transaction. This is usually tied to the sandbox seller/app account, not only the buyer email. Use a fresh US sandbox business account for PAYPAL_CLIENT_ID/SECRET and a separate US sandbox personal account as the buyer.'
          : issue === 'INSTRUMENT_DECLINED' || issue === 'PAYER_ACTION_REQUIRED'
            ? 'Your card was declined or needs additional verification. Please try a different payment method.'
          : issue === 'ORDER_EXPIRED' || issue === 'ORDER_NOT_CAPTURABLE'
            ? 'This payment session expired. Please go back and start again.'
          : description || 'PayPal could not capture the payment. Please try again.'
        );
        return res.status(402).json({ error: userMessage, paypalIssue: issue, paypalOrderExpired: issue === 'ORDER_EXPIRED' || issue === 'ORDER_NOT_CAPTURABLE' });
      }
    }

    const ok = await activateFromCapture(order, captured);
    if (!ok) {
      console.warn(`[paypal] capture: PayPal returned non-COMPLETED status for orderId=${order._id} status=${captured?.status}`);
      return res.status(402).json({ error: 'PayPal payment was not completed. Please try the payment again.', paypalOrderExpired: true });
    }

    res.json({
      message: 'Payment captured',
      orderId: order._id,
      publicSlug: order.publicSlug,
      editToken: order.editToken,
    });
  } catch (err) {
    console.error('PayPal capture error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/status/:orderId — check payment status after redirect.
// Falls back to verifying directly with PayPal's API if the webhook hasn't
// arrived yet, so the success screen activates the order without depending
// on the webhook delivery delay.
router.get('/status/:orderId', async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate('template', 'name slug previewImage');
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // If still pending and we have a PayPal order id, ask PayPal directly. If the
    // order is already captured, activate locally — webhook may follow later (idempotent).
    if (order.paymentStatus !== 'paid' && order.paymentProvider === 'paypal' && order.paypalOrderId && paypalApiConfigured()) {
      try {
        const paypalOrder = await getPaypalOrder(order.paypalOrderId);
        if (paypalOrder?.status === 'COMPLETED') {
          await activateFromCapture(order, paypalOrder);
        }
      } catch (paypalErr) {
        // Don't fail the status endpoint just because PayPal lookup failed —
        // webhook is still primary. Just log and return current state.
        console.warn('PayPal status fallback lookup failed:', paypalErr.message);
      }
    }

    res.json({
      paymentStatus: order.paymentStatus,
      status: order.status,
      publicSlug: order.publicSlug,
      editToken: order.paymentStatus === 'paid' ? order.editToken : undefined,
      template: order.template,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/edit/:editToken — get order for editing (magic link)
router.get('/edit/:editToken', validateEditToken, async (req, res) => {
  try {
    const order = await Order.findOne({ editToken: req.params.editToken })
      .populate('template');

    if (!order) return res.status(404).json({ error: 'Order not found' });

    res.json({
      id: order._id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      template: order.template,
      weddingDetails: order.weddingDetails,
      customizations: order.customizations,
      disabledFields: order.disabledFields,
      colorOverrides: order.colorOverrides,
      photos: order.photos,
      storyMilestones: order.storyMilestones,
      musicUrl: order.musicUrl,
      musicPublicId: order.musicPublicId,
      musicEnabled: order.musicEnabled,
      publicSlug: order.publicSlug,
      editsRemaining: order.editsRemaining,
      nameEditsRemaining: order.nameEditsRemaining,
      dateEditsRemaining: order.dateEditsRemaining,
      activatedAt: order.activatedAt,
      nameGraceHours: Order.NAME_EDIT_GRACE_HOURS,
      expiresAt: order.expiresAt,
      lockedFields: order.status === 'active' ? Order.LOCKED_FIELDS : [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/orders/edit/:editToken — update order (decrement edits)
router.put('/edit/:editToken', validateEditToken, async (req, res) => {
  try {
    const order = await Order.findOne({ editToken: req.params.editToken });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (!order.canEdit()) {
      return res.status(403).json({
        error: 'Edits not allowed',
        reason: order.editsRemaining <= 0 ? 'No edits remaining' : 'Invitation expired or inactive',
      });
    }

    const { weddingDetails, customizations, disabledFields, colorOverrides, photos, storyMilestones, musicUrl, musicPublicId, musicEnabled } = req.body;

    // --- Name change validation ---
    const nameChanges = weddingDetails ? order.getNameFieldChanges(weddingDetails) : [];
    if (nameChanges.length > 0) {
      // Check locked field violations (handles grace period + counter check)
      const violations = order.getLockedFieldViolations(weddingDetails);
      if (violations.length > 0) {
        const inGrace = order.isInNameGracePeriod();
        if (!inGrace) {
          return res.status(403).json({
            error: 'The 48-hour window for name corrections has expired. Couple names are now permanently locked.',
            lockedFields: violations,
          });
        }
        // In grace period but no edits left
        return res.status(403).json({
          error: 'You have already used your name correction. Couple names are now locked.',
          lockedFields: violations,
        });
      }
    }

    // --- Wedding date change validation ---
    const dateChanged = weddingDetails ? order.hasDateChanged(weddingDetails) : false;
    if (dateChanged && order.dateEditsRemaining <= 0) {
      return res.status(403).json({
        error: 'You have used both wedding date changes. The date is now locked. Contact support if you need further changes.',
        lockedFields: ['weddingDate'],
      });
    }

    const fieldsChanged = [];

    if (weddingDetails) {
      const existing = order.weddingDetails?.toObject?.() || order.weddingDetails || {};
      order.weddingDetails = { ...existing, ...weddingDetails };
      fieldsChanged.push('weddingDetails');
    }
    if (customizations) {
      for (const [k, v] of Object.entries(customizations)) order.customizations.set(k, v);
      fieldsChanged.push('customizations');
    }
    if (disabledFields) { order.disabledFields = disabledFields; fieldsChanged.push('disabledFields'); }
    if (colorOverrides) { order.colorOverrides = { ...order.colorOverrides, ...colorOverrides }; fieldsChanged.push('colorOverrides'); }
    if (photos) { order.photos = photos; fieldsChanged.push('photos'); }
    if (storyMilestones) { order.storyMilestones = storyMilestones; fieldsChanged.push('storyMilestones'); }
    if (musicUrl !== undefined) { order.musicUrl = musicUrl; fieldsChanged.push('musicUrl'); }
    if (musicPublicId !== undefined) { order.musicPublicId = musicPublicId; fieldsChanged.push('musicPublicId'); }
    if (musicEnabled !== undefined) { order.musicEnabled = musicEnabled; fieldsChanged.push('musicEnabled'); }

    // Decrement appropriate counters
    order.editsRemaining -= 1;
    if (nameChanges.length > 0) {
      order.nameEditsRemaining -= 1;
      fieldsChanged.push('coupleNames');
    }
    if (dateChanged) {
      order.dateEditsRemaining -= 1;
      fieldsChanged.push('weddingDate');
    }
    order.editHistory.push({ fieldsChanged });
    await order.save();

    // Email notifications
    if (order.editsRemaining <= 2 && order.editsRemaining > 0) {
      const email = editLimitWarningEmail({
        customerName: order.customerName,
        editsRemaining: order.editsRemaining,
        editToken: order.editToken,
      });
      sendMail({ to: order.customerEmail, ...email }).catch(console.error);
    }

    // Notify on sensitive field changes (names or date)
    if (nameChanges.length > 0 || dateChanged) {
      const email = sensitiveFieldChangeEmail({
        customerName: order.customerName,
        changedFields: [
          ...nameChanges.map(f => f === 'groomName' ? 'Partner 1 name' : 'Partner 2 name'),
          ...(dateChanged ? ['Wedding date'] : []),
        ],
        nameEditsRemaining: order.nameEditsRemaining,
        dateEditsRemaining: order.dateEditsRemaining,
        editToken: order.editToken,
      });
      sendMail({ to: order.customerEmail, ...email }).catch(console.error);
    }

    res.json({
      message: 'Invitation updated',
      editsRemaining: order.editsRemaining,
      nameEditsRemaining: order.nameEditsRemaining,
      dateEditsRemaining: order.dateEditsRemaining,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/orders/lookup — exchange the private invitationCode (sent via email)
// for the editToken needed to access the dashboard. The publicSlug from the
// share URL is intentionally NOT accepted here.
router.post('/lookup', async (req, res) => {
  try {
    const raw = (req.body?.code || '').trim().toLowerCase();
    if (!raw || !/^[a-f0-9]{8,32}$/.test(raw)) {
      return res.status(400).json({ error: 'Invalid invitation code.' });
    }

    const order = await Order.findOne({ invitationCode: raw });
    if (!order) return res.status(404).json({ error: 'Invitation not found. Please check your code and try again.' });
    if (order.status !== 'active') return res.status(403).json({ error: 'This invitation is no longer active.' });

    res.json({
      editToken: order.editToken,
      coupleName: [order.weddingDetails?.groomName, order.weddingDetails?.brideName].filter(Boolean).join(' & '),
      weddingDate: order.weddingDetails?.weddingDate,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/invite/:publicSlug — public invitation page data
router.get('/invite/:publicSlug', async (req, res) => {
  try {
    const order = await Order.findOne({ publicSlug: req.params.publicSlug, status: 'active' })
      .populate('template')
      .select('-editToken -paypalOrderId -paypalCaptureId -customerEmail -editHistory');

    if (!order) return res.status(404).json({ error: 'Invitation not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/dashboard/:editToken — full dashboard data
router.get('/dashboard/:editToken', validateEditToken, async (req, res) => {
  try {
    const order = await Order.findOne({ editToken: req.params.editToken })
      .populate('template');

    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Backfill invitationCode for orders created before this field existed.
    if (!order.invitationCode) {
      await order.save();
    }

    res.json({
      id: order._id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      template: order.template,
      weddingDetails: order.weddingDetails,
      customizations: order.customizations,
      disabledFields: order.disabledFields,
      colorOverrides: order.colorOverrides,
      photos: order.photos,
      storyMilestones: order.storyMilestones,
      musicUrl: order.musicUrl,
      musicPublicId: order.musicPublicId,
      musicEnabled: order.musicEnabled,
      publicSlug: order.publicSlug,
      invitationCode: order.invitationCode,
      editsRemaining: order.editsRemaining,
      nameEditsRemaining: order.nameEditsRemaining,
      dateEditsRemaining: order.dateEditsRemaining,
      activatedAt: order.activatedAt,
      nameGraceHours: Order.NAME_EDIT_GRACE_HOURS,
      editHistory: order.editHistory,
      expiresAt: order.expiresAt,
      createdAt: order.createdAt,
      lockedFields: order.status === 'active' ? Order.LOCKED_FIELDS : [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

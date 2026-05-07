import { Router } from 'express';
import Order from '../models/Order.js';
import Template from '../models/Template.js';
import User from '../models/User.js';
import { sendMail } from '../config/email.js';
import { orderConfirmationEmail, editLimitWarningEmail, sensitiveFieldChangeEmail } from '../utils/emailTemplates.js';
import { validateOrderBody, validateEditToken } from '../middleware/validateOrder.js';
import { getFallbackTemplate } from '../data/templateFallbacks.js';
import { findPaddleTransactionForOrder, paddleApiConfigured } from '../config/paddle.js';
import { getClientUrl } from '../config/urls.js';

const router = Router();

const PRICE_USD = process.env.PRICE_USD || '89.00';
const CLIENT_URL = getClientUrl();
const isConfigured = value => value && !value.startsWith('replace_me') && !value.startsWith('your_');
const paddleConfigured = isConfigured(process.env.PADDLE_CLIENT_TOKEN) && isConfigured(process.env.PADDLE_PRICE_ID);

// POST /api/orders - create order + Paddle checkout (or local dev activation fallback)
router.post('/', validateOrderBody, async (req, res) => {
  try {
    const { customerName, customerEmail, customerPhone, templateId, weddingDetails, customizations, disabledFields, colorOverrides, photos, musicUrl, storyMilestones } = req.body;

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

    if (paddleConfigured) {
      order.paymentProvider = 'paddle';
      order.amountPaid = PRICE_USD;
      order.currency = 'USD';
      await order.save();
      return res.status(201).json({
        orderId: order._id,
        paymentProvider: 'paddle',
        paddle: {
          clientToken: process.env.PADDLE_CLIENT_TOKEN,
          environment: process.env.PADDLE_ENVIRONMENT === 'sandbox' ? 'sandbox' : 'production',
          priceId: process.env.PADDLE_PRICE_ID,
          successUrl: `${CLIENT_URL}/order/success/${order._id}`,
        },
      });
    }

    // Dev mode: no Paddle configured, let frontend confirm locally.
    res.status(201).json({
      orderId: order._id,
      paymentProvider: 'manual',
    });
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/orders/confirm/:orderId - confirm payment in local development only
router.post('/confirm/:orderId', async (req, res) => {
  try {
    if (paddleConfigured && process.env.NODE_ENV === 'production') {
      return res.status(400).json({ error: 'Payment must be confirmed by Paddle.' });
    }

    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.paymentStatus === 'paid') {
      return res.json({ message: 'Already paid', orderId: order._id });
    }

    // Activate the order
    order.paymentProvider = 'manual';
    order.amountPaid = PRICE_USD;
    order.currency = 'USD';
    await order.activate();

    // Send confirmation email with live links
    try {
      const email = orderConfirmationEmail({
        customerName: order.customerName,
        publicSlug: order.publicSlug,
        editToken: order.editToken,
        weddingDetails: order.weddingDetails,
        isPending: false,
        invitationCode: order.publicSlug,
      });
      await sendMail({ to: order.customerEmail, ...email });
      order.confirmationSent = true;
      await order.save();
    } catch (emailErr) {
      console.error('Confirmation email failed:', emailErr.message);
    }

    res.json({
      message: 'Payment confirmed',
      orderId: order._id,
      publicSlug: order.publicSlug,
      editToken: order.editToken,
    });
  } catch (err) {
    console.error('Payment confirmation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/status/:orderId — check payment status after redirect.
// Falls back to verifying directly with Paddle's API if the webhook hasn't
// arrived yet, so the success screen activates the order without depending
// on the webhook delivery delay.
router.get('/status/:orderId', async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate('template', 'name slug previewImage');
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // If the order is still pending and we can call Paddle's API, see if a paid
    // transaction exists for this order on Paddle's side. If so, activate it
    // and send the confirmation email — webhook may follow later (idempotent).
    if (order.paymentStatus !== 'paid' && order.paymentProvider === 'paddle' && paddleApiConfigured()) {
      try {
        const tx = await findPaddleTransactionForOrder(req.params.orderId);
        if (tx && (tx.status === 'completed' || tx.status === 'paid')) {
          order.paddleTransactionId = tx.id || order.paddleTransactionId;
          order.amountPaid = tx?.details?.totals?.total || PRICE_USD;
          order.currency = tx.currency_code || order.currency || 'USD';
          await order.activate();

          if (!order.confirmationSent) {
            try {
              const email = orderConfirmationEmail({
                customerName: order.customerName,
                publicSlug: order.publicSlug,
                editToken: order.editToken,
                weddingDetails: order.weddingDetails,
                isPending: false,
                invitationCode: order.publicSlug,
              });
              await sendMail({ to: order.customerEmail, ...email });
              order.confirmationSent = true;
              await order.save();
            } catch (emailErr) {
              console.error('Confirmation email failed (status fallback):', emailErr.message);
            }
          }
        }
      } catch (paddleErr) {
        // Don't fail the status endpoint just because Paddle lookup failed —
        // webhook is still primary. Just log and return current state.
        console.warn('Paddle status fallback lookup failed:', paddleErr.message);
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

    const { weddingDetails, customizations, disabledFields, colorOverrides, photos, storyMilestones, musicUrl, musicEnabled } = req.body;

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

// GET /api/orders/lookup/:code — look up order by invitation code (for portal access)
router.get('/lookup/:code', async (req, res) => {
  try {
    const order = await Order.findOne({ publicSlug: req.params.code })
      .populate('template', 'name slug');

    if (!order) return res.status(404).json({ error: 'Invitation not found. Please check your code and try again.' });
    if (order.status !== 'active') return res.status(403).json({ error: 'This invitation is no longer active.' });

    res.json({
      publicSlug: order.publicSlug,
      editToken: order.editToken,
      coupleName: [order.weddingDetails?.groomName, order.weddingDetails?.brideName].filter(Boolean).join(' & '),
      weddingDate: order.weddingDetails?.weddingDate,
      template: order.template,
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
      .select('-editToken -paddleTransactionId -customerEmail -editHistory');

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
      musicEnabled: order.musicEnabled,
      publicSlug: order.publicSlug,
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

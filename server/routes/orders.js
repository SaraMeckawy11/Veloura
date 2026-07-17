import { Router } from 'express';
import Order from '../models/Order.js';
import Template from '../models/Template.js';
import User from '../models/User.js';
import { sendMail } from '../config/email.js';
import { orderConfirmationEmail, sensitiveFieldChangeEmail } from '../utils/emailTemplates.js';
import { validateOrderBody, validateEditToken } from '../middleware/validateOrder.js';
import { getFallbackTemplate } from '../data/templateFallbacks.js';
import { getPricingCatalog, getPricingTier, getTierAmount, normalizePricingTier, tierAllows } from '../data/pricingTiers.js';
import {
  paypalApiConfigured,
  createPaypalOrder,
  capturePaypalOrder,
  getPaypalOrder,
  extractCaptureDetails,
} from '../config/paypal.js';
import { getClientUrl } from '../config/urls.js';

const router = Router();

const PRICE_USD = process.env.PRICE_USD || '69.00';
// Keep PayPal checkout in USD. EGP is display-only because PayPal REST Checkout
// does not list EGP as a supported transaction currency.
const CURRENCY = 'USD';
const CLIENT_URL = getClientUrl();
const HIDEABLE_WEDDING_FIELDS = new Set([
  'weddingTime',
  'venueMapUrl',
  'message',
  'secondLanguage',
]);
const WEDDING_DETAIL_FIELDS = new Set([
  'groomName',
  'brideName',
  'weddingDate',
  'weddingTime',
  'timeFormat',
  'venue',
  'venueAddress',
  'venueMapUrl',
  'message',
  'language',
  'secondLanguage',
]);

function readCountry(req) {
  return req.headers['cf-ipcountry']
    || req.headers['x-vercel-ip-country']
    || req.headers['x-country-code']
    || req.headers['x-appengine-country']
    || '';
}

function getOrderDisplayPricing(req, pricingTier) {
  const region = req.body.pricingRegion || {};
  const catalog = getPricingCatalog({
    countryCode: readCountry(req),
    timezone: region.timezone,
    locale: region.locale || req.headers['accept-language'],
  });
  const tier = catalog.tiers.find(item => item.id === pricingTier);

  return {
    displayCurrency: catalog.displayCurrency,
    paymentCurrency: catalog.paymentCurrency,
    displayPrice: tier?.displayPrice,
    oldDisplayPrice: tier?.oldDisplayPrice,
    displayIsConverted: catalog.displayIsConverted,
    exchangeRate: catalog.exchangeRate,
  };
}

function getOrderPricingRegion(req) {
  const region = req.body.pricingRegion || {};
  return {
    countryCode: readCountry(req),
    timezone: region.timezone,
    locale: region.locale || req.headers['accept-language'],
  };
}

function compactPaypalText(value = '', maxLength = 127) {
  const text = `${value || ''}`.replace(/\s+/g, ' ').trim();
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

function getPaypalOrderMetadata({ order, template, pricingTier }) {
  const tier = getPricingTier(pricingTier);
  const couple = coupleName(order.weddingDetails);
  const itemName = compactPaypalText(`${tier.name} - ${template.name}`);
  const description = compactPaypalText(
    couple
      ? `${template.name} invitation for ${couple}`
      : `${template.name} wedding invitation`
  );

  return {
    invoiceId: `VEL-${order._id.toString().slice(-12).toUpperCase()}`,
    itemName,
    itemSku: `veloura-${pricingTier}-${template.slug || template._id}`,
    description,
  };
}

function normalizeDisabledFields(fields) {
  return Array.isArray(fields) ? [...new Set(fields.filter(Boolean))] : [];
}

function normalizePhotoFit(value) {
  return value === 'contain' || value === 'containFit' || value === 'fit' ? 'contain' : 'cover';
}

function normalizePhotos(photos) {
  return Array.isArray(photos)
    ? photos.map(photo => ({ ...photo, fit: normalizePhotoFit(photo?.fit) }))
    : [];
}

function enforceTierDisabledFields(pricingTier, fields) {
  const next = normalizeDisabledFields(fields);
  if (!tierAllows(pricingTier, 'rsvp') && !next.includes('rsvp')) {
    next.push('rsvp');
  }
  if (!tierAllows(pricingTier, 'coupleMessage') && !next.includes('coupleMessage')) {
    next.push('coupleMessage');
  }
  return next;
}

function photoAllowedForTier(photo, pricingTier) {
  if (photo?.label === 'story') return tierAllows(pricingTier, 'story');
  if (photo?.label === 'gallery') return tierAllows(pricingTier, 'gallery');
  if (!photo?.label) return tierAllows(pricingTier, 'gallery');
  return true;
}

function normalizeTierPhotos(photos, pricingTier) {
  return normalizePhotos(photos).filter(photo => photoAllowedForTier(photo, pricingTier));
}

function normalizeTierStoryMilestones(storyMilestones, pricingTier) {
  if (!tierAllows(pricingTier, 'story')) return [];
  return Array.isArray(storyMilestones) ? storyMilestones : [];
}

function normalizeStoryOrientation(value) {
  return value === 'landscape' ? 'landscape' : 'portrait';
}

function normalizeWeddingDetailValue(field, value) {
  if (field === 'weddingDate') {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? `${value}` : date.toISOString().slice(0, 10);
  }
  return `${value ?? ''}`.trim();
}

export function getWeddingDetailChanges(currentDetails = {}, nextDetails = {}) {
  return Object.keys(nextDetails).filter(field => (
    WEDDING_DETAIL_FIELDS.has(field)
    && normalizeWeddingDetailValue(field, currentDetails?.[field])
      !== normalizeWeddingDetailValue(field, nextDetails[field])
  ));
}

export function getDisabledWeddingFieldChanges(currentFields = [], nextFields = []) {
  const current = new Set(currentFields);
  const next = new Set(nextFields);
  return [...HIDEABLE_WEDDING_FIELDS].filter(field => current.has(field) !== next.has(field));
}

function applyDisabledFields(weddingDetails = {}, disabledFields = []) {
  const cleaned = { ...weddingDetails };
  delete cleaned.venueAddress;
  for (const field of disabledFields) {
    if (HIDEABLE_WEDDING_FIELDS.has(field)) {
      delete cleaned[field];
    }
  }
  return cleaned;
}

function publicInvitationUrl(publicSlug) {
  return publicSlug ? `${CLIENT_URL}/i/${publicSlug}` : undefined;
}

function dashboardUrl(editToken) {
  return editToken ? `${CLIENT_URL}/dashboard/${editToken}` : undefined;
}

function coupleName(weddingDetails = {}) {
  return [weddingDetails?.groomName, weddingDetails?.brideName].filter(Boolean).join(' & ');
}

async function ensureTemplateMetadata(order) {
  const update = {};

  if (!order.templateName && order.template?.name) {
    update.$set = { templateName: order.template.name };
    order.templateName = order.template.name;
  }

  if (Object.keys(update).length > 0) {
    await Order.updateOne({ _id: order._id }, update);
  }
}

// POST /api/orders - create order + PayPal order. Refuses with 503 if PayPal credentials are missing.
router.post('/', validateOrderBody, async (req, res) => {
  try {
    const { customerName, customerEmail, templateId, weddingDetails, customizations, colorOverrides, photos, musicUrl, musicPublicId, musicEnabled, storyMilestones, storyOrientation, coupleMessage } = req.body;
    const pricingTier = normalizePricingTier(req.body.pricingTier);
    const disabledFields = enforceTierDisabledFields(pricingTier, req.body.disabledFields);
    const cleanWeddingDetails = applyDisabledFields(weddingDetails, disabledFields);
    const orderAmount = getTierAmount(pricingTier, PRICE_USD, getOrderPricingRegion(req));
    const displayPricing = getOrderDisplayPricing(req, pricingTier);
    const musicAllowed = tierAllows(pricingTier, 'music');

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
      templateName: template.name,
      pricingTier,
      weddingDetails: cleanWeddingDetails,
      coupleMessage: disabledFields.includes('coupleMessage') ? undefined : coupleMessage,
      customizations: customizations || {},
      disabledFields,
      colorOverrides: colorOverrides || {},
      photos: normalizeTierPhotos(photos, pricingTier),
      musicUrl: musicAllowed ? musicUrl : undefined,
      musicPublicId: musicAllowed ? musicPublicId : undefined,
      musicEnabled: musicAllowed ? (musicEnabled !== undefined ? musicEnabled : Boolean(musicUrl)) : false,
      storyMilestones: normalizeTierStoryMilestones(storyMilestones, pricingTier),
      storyOrientation: normalizeStoryOrientation(storyOrientation),
    });
    await order.save();

    // Find or create the User. A user is identified solely by email (its unique
    // key), so the same person ordering again is never recorded as a new user.
    // The atomic upsert also avoids a duplicate-user race when two orders with a
    // brand-new email arrive at once.
    const normalizedEmail = customerEmail.toLowerCase().trim();
    const user = await User.findOneAndUpdate(
      { email: normalizedEmail },
      { $setOnInsert: { name: customerName, email: normalizedEmail } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    if (!user.orders.some(id => id.equals(order._id))) {
      user.orders.push(order._id);
      // Record how many invitations this user has created.
      user.invitationCount = user.orders.length;
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
        amount: orderAmount,
        currency: CURRENCY,
        ...getPaypalOrderMetadata({ order, template, pricingTier }),
      });
      order.paymentProvider = 'paypal';
      order.paypalOrderId = paypalOrder.id;
      order.amountPaid = orderAmount;
      order.currency = CURRENCY;
      await order.save();
      console.log(`[paypal] order created orderId=${order._id} paypalOrderId=${paypalOrder.id} amount=${orderAmount} ${CURRENCY}`);
      return res.status(201).json({
        orderId: order._id,
        paymentProvider: 'paypal',
        pricing: displayPricing,
        paypal: {
          clientId: process.env.PAYPAL_CLIENT_ID,
          environment: process.env.PAYPAL_ENVIRONMENT === 'live' ? 'live' : 'sandbox',
          paypalOrderId: paypalOrder.id,
          amount: orderAmount,
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
        invitationUrl: publicInvitationUrl(order.publicSlug),
        dashboardUrl: dashboardUrl(order.editToken),
        invitationCode: order.invitationCode,
        coupleName: coupleName(order.weddingDetails),
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
      invitationUrl: publicInvitationUrl(order.publicSlug),
      dashboardUrl: dashboardUrl(order.editToken),
      invitationCode: order.invitationCode,
      coupleName: coupleName(order.weddingDetails),
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
    await ensureTemplateMetadata(order);

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
      invitationUrl: publicInvitationUrl(order.publicSlug),
      editToken: order.paymentStatus === 'paid' ? order.editToken : undefined,
      dashboardUrl: order.paymentStatus === 'paid' ? dashboardUrl(order.editToken) : undefined,
      invitationCode: order.paymentStatus === 'paid' ? order.invitationCode : undefined,
      coupleName: order.paymentStatus === 'paid' ? coupleName(order.weddingDetails) : undefined,
      template: order.template,
      templateName: order.templateName || order.template?.name,
      pricingTier: order.pricingTier,
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
    await ensureTemplateMetadata(order);

    res.json({
      id: order._id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      template: order.template,
      templateName: order.templateName || order.template?.name,
      pricingTier: order.pricingTier,
      weddingDetails: order.weddingDetails,
      coupleMessage: order.coupleMessage,
      customizations: order.customizations,
      disabledFields: order.disabledFields,
      colorOverrides: order.colorOverrides,
      photos: order.photos,
      storyMilestones: order.storyMilestones,
      storyOrientation: order.storyOrientation,
      musicUrl: order.musicUrl,
      musicPublicId: order.musicPublicId,
      musicEnabled: order.musicEnabled,
      publicSlug: order.publicSlug,
      invitationUrl: publicInvitationUrl(order.publicSlug),
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
        reason: 'Invitation expired or inactive',
      });
    }

    const { customizations, colorOverrides, photos, storyMilestones, storyOrientation, musicUrl, musicPublicId, musicEnabled, coupleMessage } = req.body;
    const pricingTier = normalizePricingTier(order.pricingTier);
    if (order.pricingTier !== pricingTier) order.pricingTier = pricingTier;
    const disabledFields = req.body.disabledFields !== undefined
      ? enforceTierDisabledFields(pricingTier, req.body.disabledFields)
      : enforceTierDisabledFields(pricingTier, order.disabledFields || []);
    const weddingDetails = req.body.weddingDetails
      ? applyDisabledFields(req.body.weddingDetails, disabledFields)
      : undefined;
    const weddingDetailChanges = weddingDetails
      ? getWeddingDetailChanges(order.weddingDetails, weddingDetails)
      : [];
    const disabledWeddingFieldChanges = req.body.disabledFields !== undefined
      ? getDisabledWeddingFieldChanges(order.disabledFields, disabledFields)
      : [];
    const weddingDetailsChanged = weddingDetailChanges.length > 0 || disabledWeddingFieldChanges.length > 0;

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
      order.weddingDetails.venueAddress = undefined;
      if (weddingDetailsChanged) fieldsChanged.push('weddingDetails');
    }
    if (customizations) {
      for (const [k, v] of Object.entries(customizations)) order.customizations.set(k, v);
      fieldsChanged.push('customizations');
    }
    if (req.body.disabledFields !== undefined) { order.disabledFields = disabledFields; fieldsChanged.push('disabledFields'); }
    if (colorOverrides) { order.colorOverrides = { ...order.colorOverrides, ...colorOverrides }; fieldsChanged.push('colorOverrides'); }
    if (photos) { order.photos = normalizeTierPhotos(photos, pricingTier); fieldsChanged.push('photos'); }
    if (storyMilestones) { order.storyMilestones = normalizeTierStoryMilestones(storyMilestones, pricingTier); fieldsChanged.push('storyMilestones'); }
    if (storyOrientation !== undefined) { order.storyOrientation = normalizeStoryOrientation(storyOrientation); fieldsChanged.push('storyOrientation'); }
    if (tierAllows(pricingTier, 'coupleMessage')) {
      if (coupleMessage !== undefined) { order.coupleMessage = coupleMessage; fieldsChanged.push('coupleMessage'); }
    } else if (order.coupleMessage) {
      order.coupleMessage = undefined;
      fieldsChanged.push('coupleMessage');
    }
    if (tierAllows(pricingTier, 'music')) {
      if (musicUrl !== undefined) { order.musicUrl = musicUrl; fieldsChanged.push('musicUrl'); }
      if (musicPublicId !== undefined) { order.musicPublicId = musicPublicId; fieldsChanged.push('musicPublicId'); }
      if (musicEnabled !== undefined) { order.musicEnabled = musicEnabled; fieldsChanged.push('musicEnabled'); }
    } else if (order.musicUrl || order.musicPublicId || order.musicEnabled) {
      order.musicUrl = undefined;
      order.musicPublicId = undefined;
      order.musicEnabled = false;
      fieldsChanged.push('music');
    }

    // General edits are unlimited. Track actual wedding-detail edits separately
    // from the limited name/date correction counters.
    if (weddingDetailsChanged) {
      order.weddingDetailsEditCount = (order.weddingDetailsEditCount || 0) + 1;
    }
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
      coupleName: coupleName(order.weddingDetails),
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
      .select('-editToken -paypalOrderId -paypalCaptureId -customerEmail -editHistory -weddingDetailsEditCount');

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
    await ensureTemplateMetadata(order);

    res.json({
      id: order._id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      template: order.template,
      templateName: order.templateName || order.template?.name,
      pricingTier: order.pricingTier,
      weddingDetails: order.weddingDetails,
      coupleMessage: order.coupleMessage,
      customizations: order.customizations,
      disabledFields: order.disabledFields,
      colorOverrides: order.colorOverrides,
      photos: order.photos,
      storyMilestones: order.storyMilestones,
      storyOrientation: order.storyOrientation,
      musicUrl: order.musicUrl,
      musicPublicId: order.musicPublicId,
      musicEnabled: order.musicEnabled,
      publicSlug: order.publicSlug,
      invitationUrl: publicInvitationUrl(order.publicSlug),
      invitationCode: order.invitationCode,
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

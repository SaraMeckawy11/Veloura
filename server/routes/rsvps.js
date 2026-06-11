import { Router } from 'express';
import Rsvp from '../models/Rsvp.js';
import Order from '../models/Order.js';
import { tierAllows } from '../data/pricingTiers.js';

const router = Router();

// POST /api/rsvps/:publicSlug — guest submits RSVP
router.post('/:publicSlug', async (req, res) => {
  try {
    const order = await Order.findOne({ publicSlug: req.params.publicSlug, status: 'active' });
    if (!order) return res.status(404).json({ error: 'Invitation not found' });

    // Check if RSVP is disabled for this invitation
    if (order.disabledFields?.includes('rsvp') || !tierAllows(order.pricingTier, 'rsvp')) {
      return res.status(403).json({ error: 'RSVP is not enabled for this invitation' });
    }

    const { guestName, email, phone, attending, plusOne, plusOneName, guestCount, dietaryPreferences, message } = req.body;
    const submissionId = `${req.body.submissionId || ''}`.trim().slice(0, 128) || undefined;

    if (!guestName?.trim()) return res.status(400).json({ error: 'Guest name is required' });
    if (!['yes', 'no', 'maybe'].includes(attending)) return res.status(400).json({ error: 'Invalid attending value' });

    const response = {
      submissionId,
      guestName,
      email,
      phone,
      attending,
      plusOne: plusOne || false,
      plusOneName,
      guestCount: guestCount || 1,
      dietaryPreferences,
      message,
      respondedAt: new Date(),
    };

    // Each invitation has exactly one RSVP document; ensure it exists, then
    // either update this guest's existing response (same submissionId) or
    // append a new one. Retried atomically on the rare upsert race (E11000).
    let rsvpDoc;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        rsvpDoc = await Rsvp.findOneAndUpdate(
          { order: order._id },
          { $setOnInsert: { order: order._id } },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        break;
      } catch (raceErr) {
        if (raceErr.code === 11000 && attempt === 0) continue;
        throw raceErr;
      }
    }

    const existing = submissionId
      ? rsvpDoc.responses.find(r => r.submissionId === submissionId)
      : null;
    if (existing) {
      existing.set(response);
    } else {
      rsvpDoc.responses.push(response);
    }
    await rsvpDoc.save();

    // No per-RSVP email notification — responses are surfaced in the
    // couple's dashboard instead of emailing on every submission.

    res.status(201).json({ message: 'RSVP recorded', rsvp: existing || rsvpDoc.responses[rsvpDoc.responses.length - 1] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/rsvps/dashboard/:editToken — couple views all RSVPs
router.get('/dashboard/:editToken', async (req, res) => {
  try {
    const order = await Order.findOne({ editToken: req.params.editToken });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const rsvpDoc = await Rsvp.findOne({ order: order._id });
    const rsvps = (rsvpDoc?.responses || [])
      .map(r => (typeof r.toObject === 'function' ? r.toObject() : r))
      .sort((a, b) => new Date(b.respondedAt) - new Date(a.respondedAt));

    const attendingResponses = rsvps.filter(r => r.attending === 'yes');
    const attending = attendingResponses.length;
    const maybe = rsvps.filter(r => r.attending === 'maybe').length;
    const notAttending = rsvps.filter(r => r.attending === 'no').length;
    // Plus-ones only count for guests who are actually attending.
    const plusOnes = attendingResponses.filter(r => r.plusOne).length;
    const totalAttending = attendingResponses.reduce((sum, r) => sum + (r.guestCount || 1) + (r.plusOne ? 1 : 0), 0);
    const summary = {
      attending,
      maybe,
      notAttending,
      plusOnes,
      totalResponses: rsvps.length,
      totalAttending,
      totalGuests: totalAttending,
    };

    res.json({ summary, rsvps });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

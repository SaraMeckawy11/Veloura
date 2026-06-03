import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { config as loadDotenv } from 'dotenv';

// Load server/.env deterministically — independent of which directory the
// process was launched from. Without this, running `node server.js` from the
// repo root would silently miss PayPal/Brevo credentials.
const __dirname = dirname(fileURLToPath(import.meta.url));
loadDotenv({ path: resolve(__dirname, '.env') });

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import connectDB from './config/db.js';

import templateRoutes from './routes/templates.js';
import orderRoutes from './routes/orders.js';
import rsvpRoutes from './routes/rsvps.js';
import uploadRoutes from './routes/upload.js';
import webhookRoutes from './routes/webhooks.js';
import pricingRoutes from './routes/pricing.js';
import cronJob from './cron.js';
import { syncOrderTemplateMetadata } from './services/orderSync.js';
import { syncRsvpIndexes } from './services/rsvpSync.js';
import { syncDefaultTemplates } from './services/templateSync.js';
import { paypalApiConfigured } from './config/paypal.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Boot-time payment-config check — surfaces credential issues immediately.
if (paypalApiConfigured()) {
  const env = process.env.PAYPAL_ENVIRONMENT === 'live' ? 'LIVE' : 'sandbox';
  console.log(`[paypal] credentials configured (${env})`);
} else {
  console.error('[paypal] CREDENTIALS MISSING — set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in server/.env. Order creation will return 503 until they are set.');
}

// Run one-time data syncs once the database is connected. Kept off the boot
// path so the API server can start listening immediately (a slow or briefly
// unavailable DB must not stop the server from coming up — that would surface
// as a 502 to the client). Runs once per established connection.
let syncsRan = false;
async function runStartupSyncs() {
  if (syncsRan) return;
  syncsRan = true;
  try {
    const templateSyncResult = await syncDefaultTemplates();
    console.log(
      `Templates ready (${templateSyncResult.upsertedCount || 0} inserted, ${templateSyncResult.modifiedCount || 0} updated)`
    );
    const orderSyncResult = await syncOrderTemplateMetadata();
    console.log(
      `Orders normalized (${orderSyncResult.matchedCount || 0} checked, ${orderSyncResult.modifiedCount || 0} updated)`
    );
    await syncRsvpIndexes();
    console.log('RSVP indexes ready');
  } catch (err) {
    syncsRan = false;
    console.error('Startup data sync failed:', err.message);
  }
}
mongoose.connection.on('connected', runStartupSyncs);
if (mongoose.connection.readyState === 1) runStartupSyncs();

// Kick off the DB connection (retries in the background; never blocks boot).
connectDB();

// Global middleware
app.use(cors());
app.use('/api/webhooks/paypal', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));

// API routes
app.use('/api/templates', templateRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/rsvps', rsvpRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/pricing', pricingRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  cronJob.start();
});

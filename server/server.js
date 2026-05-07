import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';

import templateRoutes from './routes/templates.js';
import orderRoutes from './routes/orders.js';
import rsvpRoutes from './routes/rsvps.js';
import uploadRoutes from './routes/upload.js';
import webhookRoutes from './routes/webhooks.js';
import cronJob from './cron.js';
import { syncDefaultTemplates } from './services/templateSync.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Connect to MongoDB
await connectDB();
const templateSyncResult = await syncDefaultTemplates();
console.log(
  `Templates ready (${templateSyncResult.upsertedCount || 0} inserted, ${templateSyncResult.modifiedCount || 0} updated)`
);

// Global middleware
app.use(cors());
app.use('/api/webhooks/paddle', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));

// API routes
app.use('/api/templates', templateRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/rsvps', rsvpRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/webhooks', webhookRoutes);

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

import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import { syncDefaultTemplates } from './services/templateSync.js';

async function seed() {
  await connectDB();

  const result = await syncDefaultTemplates();
  console.log(
    `Seeded default templates (${result.upsertedCount || 0} inserted, ${result.modifiedCount || 0} updated)`
  );

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});

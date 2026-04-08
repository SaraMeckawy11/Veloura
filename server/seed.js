import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import Template from './models/Template.js';

const commonPlaceholders = [
  { key: 'groomName', label: "Partner 1's Name", type: 'text', required: true },
  { key: 'brideName', label: "Partner 2's Name", type: 'text', required: true },
  { key: 'weddingDate', label: 'Wedding Date', type: 'date', required: true },
  { key: 'weddingTime', label: 'Wedding Time', type: 'time', required: false },
  { key: 'venue', label: 'Venue Name', type: 'text', required: true },
  { key: 'venueAddress', label: 'Venue Address', type: 'text', required: false },
  { key: 'venueMapUrl', label: 'Google Maps Link', type: 'url', required: false },
  { key: 'couplePhoto', label: 'Couple Photo', type: 'image', required: false },
  { key: 'message', label: 'Personal Message', type: 'textarea', required: false, defaultValue: 'Request the pleasure of your company' },
  { key: 'musicUrl', label: 'Background Music', type: 'url', required: false },
  { key: 'primaryColor', label: 'Primary Color', type: 'color', required: false },
  { key: 'secondLanguage', label: 'Second Language Text', type: 'textarea', required: false },
];

const templates = [
  {
    name: 'Velvet Rose',
    slug: 'velvet-rose',
    category: 'launch',
    description: 'Deep burgundy & ivory. Rose petals drift as couple names appear in calligraphy. Romantic, warm, timeless.',
    envelope: 'Burgundy wax seal breaks open, rose petals scatter outward',
    previewImage: 'https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=600&h=400&fit=crop&q=80',
    colorScheme: { primary: '#8b2942', secondary: '#f5d5dc', background: '#3d0f1a' },
  },
  {
    name: 'Golden Hour',
    slug: 'golden-hour',
    category: 'launch',
    description: 'Warm gold on cream. Golden hour light washes over names with soft lens flares. Luxurious and radiant.',
    envelope: 'Gold foil envelope unfolds with a warm light burst',
    previewImage: 'https://images.unsplash.com/photo-1478146059778-26028b07395a?w=600&h=400&fit=crop&q=80',
    colorScheme: { primary: '#daa520', secondary: '#fff8e7', background: '#8b6914' },
  },
  {
    name: 'Sakura Spring',
    slug: 'sakura-spring',
    category: 'launch',
    description: 'Soft pinks, blush whites, delicate branches. Cherry blossoms rain as names fade in. Universally loved.',
    envelope: 'Pale pink envelope opens, cherry blossoms cascade down',
    previewImage: 'https://images.unsplash.com/photo-1522748906645-95d8adfd52c7?w=600&h=400&fit=crop&q=80',
    colorScheme: { primary: '#f48fb1', secondary: '#880e4f', background: '#fce4ec' },
  },
  {
    name: 'Dark Romance',
    slug: 'dark-romance',
    category: 'launch',
    description: 'Deep blacks, burgundy, crimson. Typography fades through smoke, roses emerge. Moody, passionate.',
    envelope: 'Dark velvet envelope with blood-red wax seal cracks open',
    previewImage: 'https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=600&h=400&fit=crop&q=80',
    colorScheme: { primary: '#c62828', secondary: '#ffcdd2', background: '#1a1a1a' },
  },
  {
    name: 'Pharaonic',
    slug: 'pharaonic',
    category: 'launch',
    description: 'Gold leaf, lapis blue, sandstone. Temple columns frame couple names. A design no competitor offers.',
    envelope: 'Gold sarcophagus-style envelope with hieroglyphic border unseals',
    previewImage: 'https://images.unsplash.com/photo-1553913861-c0a802e386bd?w=600&h=400&fit=crop&q=80',
    colorScheme: { primary: '#ffd54f', secondary: '#1a237e', background: '#2e1a00' },
  },
  {
    name: 'Coastal Breeze',
    slug: 'coastal-breeze',
    category: 'new',
    description: 'Soft blues, sandy neutrals, watercolor. Tide reveals handwritten names. Perfect for beach weddings.',
    envelope: 'Sand-textured envelope washes away like a wave',
    previewImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop&q=80',
    colorScheme: { primary: '#26a69a', secondary: '#004d40', background: '#e0f2f1' },
  },
  {
    name: 'Boarding Pass',
    slug: 'boarding-pass',
    category: 'new',
    description: 'Travel-themed ticket with hometowns as departure/arrival. Fun, playful, and shareable.',
    envelope: 'Airmail envelope with vintage stamps slides open',
    previewImage: 'https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=600&h=400&fit=crop&q=80',
    colorScheme: { primary: '#42a5f5', secondary: '#0d47a1', background: '#e3f2fd' },
  },
  {
    name: 'Midnight Garden',
    slug: 'midnight-garden',
    category: 'new',
    description: 'Navy & silver. Bioluminescent flowers bloom as moonlight reveals names. Enchanting and viral-worthy.',
    envelope: 'Dark envelope opens, fireflies emerge into the night',
    previewImage: 'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=600&h=400&fit=crop&q=80',
    colorScheme: { primary: '#b0bec5', secondary: '#cfd8dc', background: '#0d1b2a' },
  },
];

async function seed() {
  await connectDB();

  // Clear existing templates
  await Template.deleteMany({});

  // Insert with common placeholders
  const docs = templates.map(t => ({ ...t, placeholders: commonPlaceholders }));
  await Template.insertMany(docs);

  console.log(`Seeded ${docs.length} templates`);
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});

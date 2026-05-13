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

export const fallbackTemplates = [
  {
    name: 'Coastal Breeze',
    slug: 'coastal-breeze',
    category: 'launch',
    description: 'Denim blues, watercolor shells, flowers, birds, and sailboats for a premium coastal wedding.',
    envelope: 'Blue envelope opens to a bride and groom walking toward the sea',
    previewImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop&q=80',
    colorScheme: { primary: '#1f5f8f', secondary: '#ec866f', background: '#fffaf1' },
    placeholders: commonPlaceholders,
    active: true,
  },
  {
    name: 'Garden Pavilion',
    slug: 'gazebo-garden',
    category: 'launch',
    description: 'Soft leaf green, ivory paper, pressed botanicals, warm gold, and a dreamy animated gazebo entrance.',
    envelope: 'Animated envelope opens into a watercolor garden gazebo with a bird in flight',
    previewImage: '/assets/gazebo-watercolor-poster1.jpg',
    colorScheme: { primary: '#86ad61', secondary: '#fff8ea', background: '#eff8dc' },
    placeholders: commonPlaceholders,
    active: true,
  },
  {
    name: 'Boarding Pass',
    slug: 'boarding-pass',
    category: 'launch',
    description: 'Travel-themed ticket with hometowns as departure and arrival.',
    envelope: 'Airmail envelope with vintage stamps slides open',
    previewImage: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=600&h=400&fit=crop&q=80',
    colorScheme: { primary: '#42a5f5', secondary: '#0d47a1', background: '#e3f2fd' },
    placeholders: commonPlaceholders,
    active: true,
  },
];

export const retiredTemplateSlugs = [
  'velvet-rose',
  'golden-hour',
  'sakura-spring',
  'dark-romance',
  'pharaonic',
  'midnight-garden',
  'f1-race',
  'art-deco-noir',
  'celestial',
  'cinema',
];

export function getFallbackTemplate(slug) {
  return fallbackTemplates.find(template => template.slug === slug);
}

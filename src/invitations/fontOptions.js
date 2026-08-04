import '@fontsource/aref-ruqaa/400.css';
import '@fontsource/aref-ruqaa/700.css';
import '@fontsource-variable/noto-kufi-arabic';
import '@fontsource-variable/noto-naskh-arabic';
import './invitation-typography.css';

export const DEFAULT_INVITATION_FONT = 'classic';

// Every font definition ever offered. Kept complete so any value stored on an
// existing order still resolves, even if it's no longer shown in the picker.
const ALL_FONT_DEFS = [
  {
    value: 'classic',
    label: 'Classic Editorial',
    description: 'Refined Playfair headings with clean, modern details.',
    display: "'Playfair Display', Georgia, serif",
    body: "'Inter', Arial, sans-serif",
    script: "'Playfair Display', Georgia, serif",
  },
  {
    value: 'garden',
    label: 'Garden Serif',
    description: 'Soft Cormorant headings with airy, readable text.',
    display: "'Cormorant Garamond', Georgia, serif",
    body: "'Inter', Arial, sans-serif",
    script: "'Cormorant Garamond', Georgia, serif",
  },
  {
    value: 'heirloom',
    label: 'Heirloom Garamond',
    description: 'Timeless Garamond letters with old-world charm.',
    display: "'EB Garamond', Georgia, serif",
    body: "'EB Garamond', Georgia, serif",
    script: "'EB Garamond', Georgia, serif",
  },
  {
    value: 'storybook',
    label: 'Storybook Serif',
    description: 'Warm Lora serif with a gentle, literary feel.',
    display: "'Lora', Georgia, serif",
    body: "'Lora', Georgia, serif",
    script: "'Lora', Georgia, serif",
  },
  {
    value: 'heritage',
    label: 'Heritage Romance',
    description: 'Classic Libre Baskerville with a formal keepsake tone.',
    display: "'Libre Baskerville', Georgia, serif",
    body: "'Libre Baskerville', Georgia, serif",
    script: "'Libre Baskerville', Georgia, serif",
  },
  {
    value: 'couture',
    label: 'Couture Editorial',
    description: 'High-fashion Bodoni headings with refined serif text.',
    display: "'Bodoni Moda', 'Playfair Display', Georgia, serif",
    body: "'Lora', Georgia, serif",
    script: "'Bodoni Moda', Georgia, serif",
  },
  {
    value: 'regal',
    label: 'Regal Ceremony',
    description: 'Cinzel capitals with soft, readable ceremony copy.',
    display: "'Cinzel', 'Playfair Display', Georgia, serif",
    body: "'Lora', Georgia, serif",
    script: "'Cinzel', Georgia, serif",
  },
  {
    value: 'poetic',
    label: 'Poetic Classic',
    description: 'Crimson Text gives the invitation an intimate literary voice.',
    display: "'Crimson Text', Georgia, serif",
    body: "'Crimson Text', Georgia, serif",
    script: "'Crimson Text', Georgia, serif",
  },
  {
    value: 'romantic',
    label: 'Romantic Calligraphy',
    description: 'Flowing Great Vibes script over soft serif text.',
    display: "'Cormorant Garamond', Georgia, serif",
    body: "'Cormorant Garamond', Georgia, serif",
    script: "'Great Vibes', 'Cormorant Garamond', cursive",
  },
  {
    value: 'enchanted',
    label: 'Enchanted Script',
    description: 'Delicate Parisienne names with clean captions.',
    display: "'Cormorant Garamond', Georgia, serif",
    body: "'Inter', Arial, sans-serif",
    script: "'Parisienne', 'Great Vibes', cursive",
  },
  {
    value: 'signature',
    label: 'Signature Script',
    description: 'Elegant Allura names with graceful editorial details.',
    display: "'Cormorant Garamond', Georgia, serif",
    body: "'Cormorant Garamond', Georgia, serif",
    script: "'Allura', 'Great Vibes', cursive",
  },
  {
    value: 'formal-script',
    label: 'Formal Script',
    description: 'Pinyon Script creates a polished black-tie feel.',
    display: "'Cormorant Garamond', Georgia, serif",
    body: "'Libre Baskerville', Georgia, serif",
    script: "'Pinyon Script', 'Great Vibes', cursive",
  },
  {
    value: 'whimsical',
    label: 'Whimsical Hand',
    description: 'Casual Sacramento handwriting with soft serif.',
    display: "'Cormorant Garamond', Georgia, serif",
    body: "'Cormorant Garamond', Georgia, serif",
    script: "'Sacramento', 'Great Vibes', cursive",
  },
  {
    value: 'timeless',
    label: 'Timeless Romance',
    description: 'Graceful Dancing Script names with classic serif.',
    display: "'Cormorant Garamond', Georgia, serif",
    body: "'Inter', Arial, sans-serif",
    script: "'Dancing Script', 'Cormorant Garamond', cursive",
  },
  {
    value: 'modern',
    label: 'Modern Minimal',
    description: 'Polished, simple, and very easy to read.',
    display: "'Inter', Arial, sans-serif",
    body: "'Inter', Arial, sans-serif",
    script: "'Inter', Arial, sans-serif",
  },
  {
    value: 'contemporary',
    label: 'Contemporary Sans',
    description: 'Crisp geometric Montserrat for a modern look.',
    display: "'Montserrat', Arial, sans-serif",
    body: "'Montserrat', Arial, sans-serif",
    script: "'Montserrat', Arial, sans-serif",
  },
  {
    value: 'soft-modern',
    label: 'Soft Modern',
    description: 'Rounded Nunito text for a friendly contemporary invitation.',
    display: "'Nunito', Arial, sans-serif",
    body: "'Nunito', Arial, sans-serif",
    script: "'Nunito', Arial, sans-serif",
  },
  {
    value: 'marquee',
    label: 'Marquee Serif',
    description: 'Marcellus brings quiet cinematic title lettering.',
    display: "'Marcellus', 'Cinzel', Georgia, serif",
    body: "'Inter', Arial, sans-serif",
    script: "'Marcellus', Georgia, serif",
  },
  {
    value: 'estate',
    label: 'Estate Serif',
    description: 'Prata gives the invitation a poised, luxury stationery feel.',
    display: "'Prata', 'Playfair Display', Georgia, serif",
    body: "'Lora', Georgia, serif",
    script: "'Prata', Georgia, serif",
  },
  {
    value: 'vow-script',
    label: 'Vow Script',
    description: 'Alex Brush names with soft classic ceremony text.',
    display: "'Cormorant Garamond', Georgia, serif",
    body: "'Cormorant Garamond', Georgia, serif",
    script: "'Alex Brush', 'Great Vibes', cursive",
  },
  {
    value: 'royal-note',
    label: 'Royal Note',
    description: 'Petit Formal Script adds a delicate handwritten flourish.',
    display: "'Libre Baskerville', Georgia, serif",
    body: "'Libre Baskerville', Georgia, serif",
    script: "'Petit Formal Script', 'Pinyon Script', cursive",
  },
  {
    value: 'soft-heirloom',
    label: 'Soft Heirloom',
    description: 'Cormorant Infant feels romantic, warm, and easy to read.',
    display: "'Cormorant Infant', 'Cormorant Garamond', Georgia, serif",
    body: "'Cormorant Infant', Georgia, serif",
    script: "'Cormorant Infant', Georgia, serif",
  },
  {
    value: 'modern-luxe',
    label: 'Modern Luxe',
    description: 'Josefin Sans gives a polished editorial, fashion-forward look.',
    display: "'Josefin Sans', 'Montserrat', Arial, sans-serif",
    body: "'Josefin Sans', Arial, sans-serif",
    script: "'Josefin Sans', Arial, sans-serif",
  },
  {
    value: 'artful-serif',
    label: 'Artful Serif',
    description: 'Fraunces creates expressive titles with refined body copy.',
    display: "'Fraunces', 'Playfair Display', Georgia, serif",
    body: "'Crimson Text', Georgia, serif",
    script: "'Fraunces', Georgia, serif",
  },
  {
    value: 'monogram',
    label: 'Monogram Display',
    description: 'DM Serif Display gives names a clean, magazine-like presence.',
    display: "'DM Serif Display', 'Playfair Display', Georgia, serif",
    body: "'Inter', Arial, sans-serif",
    script: "'DM Serif Display', Georgia, serif",
  },
  {
    value: 'ruqaa-classic',
    label: 'Classic Ruqaa · رقعة كلاسيكية',
    description: 'Traditional Ruqaa names with calm, readable invitation text.',
    display: "'Cormorant Garamond', Georgia, serif",
    body: "'Cormorant Garamond', Georgia, serif",
    script: "'Alex Brush', 'Great Vibes', cursive",
  },
  {
    value: 'ruqaa-ink',
    label: 'Ink Ruqaa · رقعة حبرية',
    description: 'An expressive inked Ruqaa style with natural handwritten texture.',
    display: "'Cormorant Garamond', Georgia, serif",
    body: "'Inter', Arial, sans-serif",
    script: "'Allura', 'Great Vibes', cursive",
  },
  {
    value: 'ruqaa-bold',
    label: 'Bold Ruqaa · رقعة بارزة',
    description: 'A strong, celebratory Ruqaa-inspired display for prominent names.',
    display: "'DM Serif Display', 'Playfair Display', Georgia, serif",
    body: "'Inter', Arial, sans-serif",
    script: "'Great Vibes', 'Cormorant Garamond', cursive",
  },
];

// Keep the original demo font first, then offer the full serif, sans, script,
// and Arabic Ruqaa range. Existing saved values continue to resolve through
// ALL_FONT_DEFS even if this display order changes later.
const FONT_PICKER_ORDER = [
  'classic',
  'garden',
  'heirloom',
  'storybook',
  'heritage',
  'couture',
  'regal',
  'poetic',
  'estate',
  'soft-heirloom',
  'artful-serif',
  'monogram',
  'marquee',
  'modern',
  'contemporary',
  'soft-modern',
  'modern-luxe',
  'romantic',
  'enchanted',
  'signature',
  'formal-script',
  'vow-script',
  'royal-note',
  'whimsical',
  'timeless',
  'ruqaa-classic',
  'ruqaa-ink',
  'ruqaa-bold',
];

// Latin fonts do not contain Arabic glyphs, so Arabic names fall through to
// these families. Each visible picker option deliberately has a distinct name
// face instead of collapsing into the same Naskh, Kufi, or Ruqaa fallback.
const ARABIC_NASKH = "'Noto Naskh Arabic Variable'";
const ARABIC_KUFI = "'Noto Kufi Arabic Variable'";

function arabicFont(display, body = display, script = display) {
  return { display, body, script };
}

const ARABIC_FONT_DEFS = {
  classic: arabicFont("'Amiri'"),
  garden: arabicFont("'Katibeh'", ARABIC_NASKH),
  heirloom: arabicFont("'Scheherazade New'"),
  storybook: arabicFont("'Harmattan'"),
  heritage: arabicFont(ARABIC_NASKH),
  couture: arabicFont("'El Messiri'", ARABIC_NASKH),
  regal: arabicFont("'Reem Kufi'", "'Tajawal'"),
  poetic: arabicFont("'Lateef'"),
  romantic: arabicFont("'Aref Ruqaa'", ARABIC_NASKH),
  enchanted: arabicFont("'Katibeh'", ARABIC_NASKH),
  signature: arabicFont("'Rakkas'", ARABIC_NASKH),
  'formal-script': arabicFont("'Lateef'", "'Scheherazade New'"),
  whimsical: arabicFont("'Lemonada'", "'Tajawal'"),
  timeless: arabicFont("'Marhey'", ARABIC_NASKH),
  modern: arabicFont("'Tajawal'"),
  contemporary: arabicFont("'Cairo'"),
  'soft-modern': arabicFont("'IBM Plex Sans Arabic'"),
  marquee: arabicFont("'Changa'", "'Tajawal'"),
  estate: arabicFont("'Harmattan'"),
  'vow-script': arabicFont("'Aref Ruqaa'", ARABIC_NASKH),
  'royal-note': arabicFont("'Katibeh'", ARABIC_NASKH),
  'soft-heirloom': arabicFont("'Scheherazade New'"),
  'modern-luxe': arabicFont("'IBM Plex Sans Arabic'"),
  'artful-serif': arabicFont("'Rakkas'", ARABIC_NASKH),
  monogram: arabicFont("'Lalezar'", "'Tajawal'"),
  'ruqaa-classic': arabicFont("'Aref Ruqaa'", ARABIC_NASKH),
  'ruqaa-ink': arabicFont("'Aref Ruqaa Ink'", ARABIC_NASKH),
  'ruqaa-bold': arabicFont("'Rakkas'", "'Tajawal'"),
};

function getArabicFontFamily(value, role) {
  return ARABIC_FONT_DEFS[value]?.[role] || ARABIC_KUFI;
}

function addArabicFallback(fontStack, arabicFamily) {
  return fontStack.replace(
    /,\s*(serif|sans-serif|cursive)\s*$/,
    `, ${arabicFamily}, $1`,
  );
}

function enrichFontOption(option) {
  if (!option) return option;
  return {
    ...option,
    display: addArabicFallback(option.display, getArabicFontFamily(option.value, 'display')),
    body: addArabicFallback(option.body, getArabicFontFamily(option.value, 'body')),
    script: addArabicFallback(option.script, getArabicFontFamily(option.value, 'script')),
  };
}

export const INVITATION_FONT_OPTIONS = FONT_PICKER_ORDER
  .map(value => ALL_FONT_DEFS.find(option => option.value === value))
  .map(enrichFontOption)
  .filter(Boolean);

export function normalizeInvitationFont(value) {
  return ALL_FONT_DEFS.some(option => option.value === value)
    ? value
    : DEFAULT_INVITATION_FONT;
}

export function getInvitationFontOption(value) {
  const normalized = normalizeInvitationFont(value);
  return enrichFontOption(ALL_FONT_DEFS.find(option => option.value === normalized) || ALL_FONT_DEFS[0]);
}

export function readInvitationFont(order, fallback = DEFAULT_INVITATION_FONT) {
  const customizations = order?.customizations;
  const raw = typeof customizations?.get === 'function'
    ? customizations.get('invitationFont')
    : customizations?.invitationFont;
  const normalized = normalizeInvitationFont(raw);

  // Individual designs may retain their original type system as the default,
  // while every explicitly selected non-default font still takes precedence.
  return normalized === DEFAULT_INVITATION_FONT
    ? normalizeInvitationFont(fallback)
    : normalized;
}

export function getInvitationFontStyle(order, fallback = DEFAULT_INVITATION_FONT) {
  const option = getInvitationFontOption(readInvitationFont(order, fallback));
  return {
    '--font-display': option.display,
    '--font-body': option.body,
    '--font-script': option.script,
    '--font-script-alt': option.script,
    '--font-script-soft': option.script,
    '--font-marquee': option.display,
    '--font-soft': option.body,
    '--font-mono': option.body,
    '--gc-font': option.body,
  };
}

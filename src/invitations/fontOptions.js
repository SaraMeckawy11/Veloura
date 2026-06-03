export const DEFAULT_INVITATION_FONT = 'classic';

export const INVITATION_FONT_OPTIONS = [
  {
    value: 'classic',
    label: 'Classic Editorial',
    description: 'Refined Playfair headings with clean, modern details.',
    display: "'Playfair Display', Georgia, serif",
    body: "'Inter', Arial, sans-serif",
    script: "'Playfair Display', Georgia, serif",
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
];

export function normalizeInvitationFont(value) {
  return INVITATION_FONT_OPTIONS.some(option => option.value === value)
    ? value
    : DEFAULT_INVITATION_FONT;
}

export function getInvitationFontOption(value) {
  const normalized = normalizeInvitationFont(value);
  return INVITATION_FONT_OPTIONS.find(option => option.value === normalized) || INVITATION_FONT_OPTIONS[0];
}

export function readInvitationFont(order) {
  const customizations = order?.customizations;
  const raw = typeof customizations?.get === 'function'
    ? customizations.get('invitationFont')
    : customizations?.invitationFont;
  return normalizeInvitationFont(raw);
}

export function getInvitationFontStyle(order) {
  const option = getInvitationFontOption(readInvitationFont(order));
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

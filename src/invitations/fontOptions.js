export const DEFAULT_INVITATION_FONT = 'classic';

export const INVITATION_FONT_OPTIONS = [
  {
    value: 'classic',
    label: 'Classic Editorial',
    description: 'Elegant serif titles with clean guest details.',
    display: "'Cormorant Garamond', Georgia, serif",
    body: "'Inter', Arial, sans-serif",
    script: "'Cormorant Garamond', Georgia, serif",
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
    value: 'romantic',
    label: 'Romantic Serif',
    description: 'Soft wedding stationery feel with graceful headings.',
    display: "'Cormorant Garamond', Georgia, serif",
    body: "'Cormorant Garamond', Georgia, serif",
    script: "'Cormorant Garamond', Georgia, serif",
  },
  {
    value: 'timeless',
    label: 'Timeless Formal',
    description: 'Formal, refined, and ceremony-forward.',
    display: "Georgia, 'Times New Roman', serif",
    body: "Georgia, 'Times New Roman', serif",
    script: "Georgia, 'Times New Roman', serif",
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

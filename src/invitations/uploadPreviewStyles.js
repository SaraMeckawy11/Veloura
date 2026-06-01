const TEMPLATE_UPLOAD_STYLES = {
  'boarding-pass': {
    story: {
      '--invitation-photo-pad': '0.35rem',
      '--invitation-photo-scale': '1',
      '--invitation-photo-hover-scale': '1.03',
      '--invitation-photo-surface': 'linear-gradient(180deg, hsl(203, 28%, 88%), hsl(38, 45%, 97%))',
      '--invitation-photo-overlay-top': 'rgba(253, 244, 236, 0.1)',
      '--invitation-photo-overlay-bottom': 'rgba(245, 236, 226, 0.42)',
      '--invitation-photo-shadow': 'rgba(46, 22, 28, 0.18)',
    },
    gallery: {
      '--invitation-photo-pad': '0.3rem',
      '--invitation-photo-scale': '1.1',
      '--invitation-photo-hover-scale': '1.14',
      '--invitation-photo-surface': 'linear-gradient(180deg, hsl(203, 28%, 88%), hsl(38, 45%, 97%))',
      '--invitation-photo-overlay-top': 'rgba(251, 239, 231, 0.12)',
      '--invitation-photo-overlay-bottom': 'rgba(246, 238, 228, 0.46)',
      '--invitation-photo-shadow': 'rgba(46, 22, 28, 0.22)',
    },
  },
  'coastal-breeze': {
    story: {
      '--invitation-photo-pad': '0.3rem',
      '--invitation-photo-scale': '1',
      '--invitation-photo-hover-scale': '1.03',
      '--invitation-photo-surface': 'linear-gradient(180deg, rgba(255, 253, 247, 0.94), rgba(238, 248, 250, 0.92))',
      '--invitation-photo-overlay-top': 'rgba(255, 255, 255, 0.1)',
      '--invitation-photo-overlay-bottom': 'rgba(251, 246, 236, 0.3)',
      '--invitation-photo-shadow': 'rgba(20, 53, 83, 0.18)',
    },
    gallery: {
      '--invitation-photo-pad': '0.24rem',
      '--invitation-photo-scale': '1.12',
      '--invitation-photo-hover-scale': '1.16',
      '--invitation-photo-surface': 'linear-gradient(180deg, rgba(255, 253, 247, 0.96), rgba(240, 246, 250, 0.92))',
      '--invitation-photo-overlay-top': 'rgba(255, 255, 255, 0.08)',
      '--invitation-photo-overlay-bottom': 'rgba(247, 241, 228, 0.26)',
      '--invitation-photo-shadow': 'rgba(20, 53, 83, 0.2)',
    },
  },
  'fountain-reverie-v1': {
    story: {
      '--invitation-photo-pad': '0.3rem',
      '--invitation-photo-scale': '1',
      '--invitation-photo-hover-scale': '1.03',
      '--invitation-photo-surface': 'linear-gradient(180deg, rgba(255, 253, 247, 0.94), rgba(248, 230, 210, 0.78))',
      '--invitation-photo-overlay-top': 'rgba(255, 255, 255, 0.1)',
      '--invitation-photo-overlay-bottom': 'rgba(255, 244, 228, 0.3)',
      '--invitation-photo-shadow': 'rgba(75, 54, 17, 0.18)',
    },
    gallery: {
      '--invitation-photo-pad': '0.3rem',
      '--invitation-photo-scale': '1.1',
      '--invitation-photo-hover-scale': '1.14',
      '--invitation-photo-surface': 'linear-gradient(180deg, rgba(255, 253, 247, 0.94), rgba(248, 230, 210, 0.78))',
      '--invitation-photo-overlay-top': 'rgba(255, 255, 255, 0.1)',
      '--invitation-photo-overlay-bottom': 'rgba(255, 244, 228, 0.3)',
      '--invitation-photo-shadow': 'rgba(75, 54, 17, 0.18)',
    },
  },
  'gazebo-garden': {
    story: {
      '--invitation-photo-pad': '0.32rem',
      '--invitation-photo-scale': '1',
      '--invitation-photo-hover-scale': '1.03',
      '--invitation-photo-surface': 'linear-gradient(180deg, rgba(255, 255, 251, 0.9), rgba(241, 248, 236, 0.92))',
      '--invitation-photo-overlay-top': 'rgba(255, 255, 255, 0.08)',
      '--invitation-photo-overlay-bottom': 'rgba(245, 250, 238, 0.24)',
      '--invitation-photo-shadow': 'rgba(70, 83, 52, 0.18)',
    },
    gallery: {
      '--invitation-photo-pad': '0.24rem',
      '--invitation-photo-scale': '1.12',
      '--invitation-photo-hover-scale': '1.16',
      '--invitation-photo-surface': 'linear-gradient(180deg, rgba(255, 255, 251, 0.9), rgba(240, 247, 235, 0.94))',
      '--invitation-photo-overlay-top': 'rgba(255, 255, 255, 0.08)',
      '--invitation-photo-overlay-bottom': 'rgba(244, 249, 238, 0.24)',
      '--invitation-photo-shadow': 'rgba(69, 88, 59, 0.2)',
    },
  },
  theater: {
    story: {
      '--invitation-photo-scale': '1',
      '--invitation-photo-hover-scale': '1.03',
      '--invitation-photo-surface': '#2a1810',
      '--invitation-photo-overlay-top': 'rgba(246, 231, 200, 0.08)',
      '--invitation-photo-overlay-bottom': 'rgba(42, 24, 16, 0.42)',
      '--invitation-photo-shadow': 'rgba(42, 24, 16, 0.28)',
    },
    gallery: {
      '--invitation-photo-surface': '#2a1810',
      '--invitation-photo-overlay-top': 'rgba(246, 231, 200, 0.08)',
      '--invitation-photo-overlay-bottom': 'rgba(42, 24, 16, 0.42)',
      '--invitation-photo-shadow': 'rgba(42, 24, 16, 0.28)',
    },
  },
};
TEMPLATE_UPLOAD_STYLES['fountain-reverie-v2'] = TEMPLATE_UPLOAD_STYLES['fountain-reverie-v1'];

const TEMPLATE_UPLOAD_LAYOUTS = {
  'boarding-pass': {
    story: { width: '132px', aspectRatio: '4 / 3' },
    gallery: { width: '148px', aspectRatio: '1 / 1' },
  },
  'coastal-breeze': {
    story: { width: '132px', aspectRatio: '4 / 3' },
    gallery: { width: '148px', aspectRatio: '11 / 14' },
  },
  'fountain-reverie-v1': {
    story: { width: '132px', aspectRatio: '4 / 3' },
    gallery: { width: '148px', aspectRatio: '11 / 14' },
  },
  'fountain-reverie-v2': {
    story: { width: '132px', aspectRatio: '4 / 3' },
    gallery: { width: '148px', aspectRatio: '11 / 14' },
  },
  'gazebo-garden': {
    story: { width: '132px', aspectRatio: '4 / 3' },
    gallery: { width: '148px', aspectRatio: '11 / 14' },
  },
  theater: {
    story: { width: '132px', aspectRatio: '16 / 10' },
    gallery: { width: '148px', aspectRatio: '268 / 404' },
  },
};

export function getUploadPreviewStyle(templateSlug, category) {
  const templateStyles = TEMPLATE_UPLOAD_STYLES[templateSlug] || TEMPLATE_UPLOAD_STYLES['boarding-pass'];
  const templateLayouts = TEMPLATE_UPLOAD_LAYOUTS[templateSlug] || TEMPLATE_UPLOAD_LAYOUTS['boarding-pass'];
  const previewCategory = category === 'gallery' ? 'gallery' : 'story';
  const layout = templateLayouts[previewCategory];

  return {
    '--upload-preview-width': layout.width,
    '--upload-preview-aspect-ratio': layout.aspectRatio,
    ...templateStyles[previewCategory],
  };
}

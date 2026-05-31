const PAGE_WIDTH = 1240;
const PAGE_HEIGHT = 1754;
const PDF_WIDTH = 595.28;
const PDF_HEIGHT = 841.89;
const PAGE_MARGIN = 92;
const CARD_GAP = 24;

const THEMES = {
  'boarding-pass': {
    name: 'Boarding Pass',
    background: '#f6efe5',
    card: '#fffaf2',
    ink: '#26364d',
    muted: '#6e7b88',
    accent: '#b98b52',
    soft: '#ead9c2',
  },
  'coastal-breeze': {
    name: 'Coastal Breeze',
    background: '#eff7f8',
    card: '#fffdf7',
    ink: '#1f5f8f',
    muted: '#628197',
    accent: '#ec866f',
    soft: '#cfe4e8',
  },
  'fountain-reverie-v1': {
    name: 'Fountain Reverie',
    background: '#fff6e8',
    card: '#fffdf7',
    ink: '#6f5725',
    muted: '#8d7c58',
    accent: '#94742f',
    soft: '#ead9ba',
  },
  'fountain-reverie-v2': {
    name: 'Fountain Reverie',
    background: '#f7f5e8',
    card: '#fffdf7',
    ink: '#566044',
    muted: '#7b806d',
    accent: '#94742f',
    soft: '#dfe2ca',
  },
  'gazebo-garden': {
    name: 'Garden Pavilion',
    background: '#eff8dc',
    card: '#fffffb',
    ink: '#52713d',
    muted: '#7c9271',
    accent: '#c79e63',
    soft: '#dcecc5',
  },
  theater: {
    name: 'Theater',
    background: '#f8ead2',
    card: '#fff8e9',
    ink: '#6e0f1f',
    muted: '#8b665c',
    accent: '#b8862a',
    soft: '#ead1a8',
  },
};

function getTheme(slug) {
  return THEMES[slug] || THEMES['boarding-pass'];
}

function drawCenteredText(ctx, text, y) {
  ctx.fillText(text, PAGE_WIDTH / 2, y);
}

function drawDecor(ctx, theme) {
  ctx.strokeStyle = theme.soft;
  ctx.lineWidth = 3;
  ctx.strokeRect(34, 34, PAGE_WIDTH - 68, PAGE_HEIGHT - 68);
  ctx.strokeRect(48, 48, PAGE_WIDTH - 96, PAGE_HEIGHT - 96);

  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 2;
  const center = PAGE_WIDTH / 2;
  ctx.beginPath();
  ctx.moveTo(center - 180, 198);
  ctx.lineTo(center - 38, 198);
  ctx.moveTo(center + 38, 198);
  ctx.lineTo(center + 180, 198);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(center, 198, 13, 0, Math.PI * 2);
  ctx.stroke();

  for (const x of [68, PAGE_WIDTH - 68]) {
    for (const y of [68, PAGE_HEIGHT - 68]) {
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

function drawPageBase(ctx, theme, coupleNames) {
  ctx.fillStyle = theme.background;
  ctx.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
  drawDecor(ctx, theme);

  ctx.textAlign = 'center';
  ctx.fillStyle = theme.ink;
  ctx.font = 'italic 44px Georgia, serif';
  drawCenteredText(ctx, coupleNames || 'Our Wedding', 126);

  ctx.fillStyle = theme.accent;
  ctx.font = '700 19px Arial, sans-serif';
  drawCenteredText(ctx, 'GUEST MESSAGES', 178);

  ctx.fillStyle = theme.muted;
  ctx.font = 'italic 22px Georgia, serif';
  drawCenteredText(ctx, 'Words from the people celebrating with you', 246);
}

function createPage(theme, coupleNames) {
  const canvas = document.createElement('canvas');
  canvas.width = PAGE_WIDTH;
  canvas.height = PAGE_HEIGHT;
  const ctx = canvas.getContext('2d');
  drawPageBase(ctx, theme, coupleNames);
  return { canvas, ctx, y: 310 };
}

function wrapText(ctx, text, maxWidth) {
  const paragraphs = `${text || ''}`.split(/\r?\n/);
  const lines = [];

  paragraphs.forEach((paragraph, paragraphIndex) => {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (!words.length) {
      lines.push('');
    } else {
      let line = '';
      words.forEach(word => {
        const next = line ? `${line} ${word}` : word;
        if (line && ctx.measureText(next).width > maxWidth) {
          lines.push(line);
          line = word;
        } else {
          line = next;
        }
      });
      if (line) lines.push(line);
    }
    if (paragraphIndex < paragraphs.length - 1) lines.push('');
  });

  return lines.length ? lines : [''];
}

function drawMessageCard(page, theme, lines, guestName, isLastSegment) {
  const lineHeight = 39;
  const signatureHeight = isLastSegment ? 64 : 24;
  const cardHeight = 64 + (lines.length * lineHeight) + signatureHeight;
  const x = PAGE_MARGIN;
  const y = page.y;
  const width = PAGE_WIDTH - (PAGE_MARGIN * 2);

  page.ctx.fillStyle = theme.card;
  page.ctx.strokeStyle = theme.soft;
  page.ctx.lineWidth = 2;
  page.ctx.beginPath();
  page.ctx.roundRect(x, y, width, cardHeight, 18);
  page.ctx.fill();
  page.ctx.stroke();

  page.ctx.textAlign = 'left';
  page.ctx.fillStyle = theme.accent;
  page.ctx.font = 'italic 58px Georgia, serif';
  page.ctx.fillText('"', x + 34, y + 65);

  page.ctx.fillStyle = theme.ink;
  page.ctx.font = 'italic 28px Georgia, serif';
  lines.forEach((line, index) => {
    page.ctx.fillText(line, x + 78, y + 64 + (index * lineHeight));
  });

  if (isLastSegment) {
    page.ctx.textAlign = 'right';
    page.ctx.fillStyle = theme.accent;
    page.ctx.font = 'italic 25px Georgia, serif';
    page.ctx.fillText(`- ${guestName || 'Guest'}`, x + width - 36, y + cardHeight - 28);
  }

  page.y += cardHeight + CARD_GAP;
}

function drawFooter(page, theme, pageNumber, pageCount) {
  page.ctx.textAlign = 'center';
  page.ctx.fillStyle = theme.muted;
  page.ctx.font = '16px Arial, sans-serif';
  drawCenteredText(page.ctx, `${theme.name}  |  Veloura  |  ${pageNumber} / ${pageCount}`, PAGE_HEIGHT - 74);
}

function canvasToJpeg(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) {
        reject(new Error('Could not render the guest messages PDF.'));
        return;
      }
      blob.arrayBuffer().then(buffer => resolve(new Uint8Array(buffer)), reject);
    }, 'image/jpeg', 0.92);
  });
}

function encodeAscii(value) {
  return new TextEncoder().encode(value);
}

function concatBytes(chunks) {
  const length = chunks.reduce((total, chunk) => total + chunk.length, 0);
  const result = new Uint8Array(length);
  let offset = 0;
  chunks.forEach(chunk => {
    result.set(chunk, offset);
    offset += chunk.length;
  });
  return result;
}

export function buildPdfFromJpegPages(images) {
  const objects = [];
  const pageIds = images.map((_, index) => 3 + (index * 3));
  const imageIds = images.map((_, index) => 4 + (index * 3));
  const contentIds = images.map((_, index) => 5 + (index * 3));

  objects[1] = encodeAscii('<< /Type /Catalog /Pages 2 0 R >>');
  objects[2] = encodeAscii(`<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${images.length} >>`);

  images.forEach((image, index) => {
    const pageId = pageIds[index];
    const imageId = imageIds[index];
    const contentId = contentIds[index];
    const content = encodeAscii(`q\n${PDF_WIDTH} 0 0 ${PDF_HEIGHT} 0 0 cm\n/Im0 Do\nQ\n`);

    objects[pageId] = encodeAscii(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PDF_WIDTH} ${PDF_HEIGHT}] /Resources << /XObject << /Im0 ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`);
    objects[imageId] = concatBytes([
      encodeAscii(`<< /Type /XObject /Subtype /Image /Width ${PAGE_WIDTH} /Height ${PAGE_HEIGHT} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.length} >>\nstream\n`),
      image,
      encodeAscii('\nendstream'),
    ]);
    objects[contentId] = concatBytes([
      encodeAscii(`<< /Length ${content.length} >>\nstream\n`),
      content,
      encodeAscii('endstream'),
    ]);
  });

  const chunks = [encodeAscii('%PDF-1.4\n')];
  const offsets = [0];
  let offset = chunks[0].length;

  for (let id = 1; id < objects.length; id += 1) {
    const chunk = concatBytes([
      encodeAscii(`${id} 0 obj\n`),
      objects[id],
      encodeAscii('\nendobj\n'),
    ]);
    offsets[id] = offset;
    chunks.push(chunk);
    offset += chunk.length;
  }

  const xrefOffset = offset;
  const xref = [
    `xref\n0 ${objects.length}\n`,
    '0000000000 65535 f \n',
    ...offsets.slice(1).map(value => `${String(value).padStart(10, '0')} 00000 n \n`),
    `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`,
  ].join('');
  chunks.push(encodeAscii(xref));

  return concatBytes(chunks);
}

function sanitizeFilename(value) {
  return `${value || 'wedding'}`.trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'wedding';
}

export async function downloadGuestMessagesPdf({ themeSlug, coupleNames, messages }) {
  const theme = getTheme(themeSlug);
  const pages = [];
  let page = createPage(theme, coupleNames);
  pages.push(page);

  messages.forEach(message => {
    page.ctx.font = 'italic 28px Georgia, serif';
    const lines = wrapText(page.ctx, message.message, PAGE_WIDTH - (PAGE_MARGIN * 2) - 156);
    const maxLinesPerCard = 25;
    const segments = [];
    for (let index = 0; index < lines.length; index += maxLinesPerCard) {
      segments.push(lines.slice(index, index + maxLinesPerCard));
    }

    segments.forEach((segment, index) => {
      const isLastSegment = index === segments.length - 1;
      const cardHeight = 64 + (segment.length * 39) + (isLastSegment ? 64 : 24);
      if (page.y + cardHeight > PAGE_HEIGHT - 128) {
        page = createPage(theme, coupleNames);
        pages.push(page);
      }
      drawMessageCard(page, theme, segment, message.guestName, isLastSegment);
    });
  });

  pages.forEach((currentPage, index) => drawFooter(currentPage, theme, index + 1, pages.length));
  const jpegPages = await Promise.all(pages.map(currentPage => canvasToJpeg(currentPage.canvas)));
  const pdfBytes = buildPdfFromJpegPages(jpegPages);
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${sanitizeFilename(coupleNames)}-guest-messages.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

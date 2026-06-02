import coverEmptyUrl from '../assets/messages/coverEmpty.png';
import coverLastUrl from '../assets/messages/coverLast.png';

const PAGE_WIDTH = 1240;
const PAGE_HEIGHT = 1754;
const PDF_WIDTH = 595.28;
const PDF_HEIGHT = 841.89;
const PAGE_MARGIN = 92;
const CARD_GAP = 24;

// ── Guest Messages keepsake (image-backed design) ──────────────────────────
// Native pixel size of the artwork in src/assets/messages (971 x 1619).
const MSG_PAGE_W = 971;
const MSG_PAGE_H = 1619;
// PDF point size keeps the artwork's aspect ratio (physical size is arbitrary
// for a digital keepsake, the ratio is what matters so nothing distorts).
const MSG_PAGE_W_PT = 480;
const MSG_PAGE_H_PT = (MSG_PAGE_W_PT * MSG_PAGE_H) / MSG_PAGE_W;
const MSG_CREAM = '#fdf9f3'; // page background — lighter than the cover artwork
const MSG_FRAME = '#cfa978'; // single border colour, sampled from the reference
const MSG_MARGIN_X = 80;
const MSG_CONTENT_TOP = 272;
const MSG_CONTENT_BOTTOM = MSG_PAGE_H - 124;
const MSG_CARD_GAP = 26;
const MSG_LINE_HEIGHT = 42;
const MSG_MSG_START = 58;   // first message baseline from card top
const MSG_SIG_GAP = 52;     // last message baseline → signature baseline
const MSG_SIG_BOTTOM = 30;  // signature baseline → card bottom
// Match the rest of the site: Cormorant Garamond display serif (loaded globally).
const MSG_HEADER_FONT = "600 58px 'Cormorant Garamond', Georgia, serif";
const MSG_MESSAGE_FONT = "italic 500 31px 'Cormorant Garamond', Georgia, serif";
const MSG_SIGNATURE_FONT = "italic 600 31px 'Cormorant Garamond', Georgia, serif";
const MSG_NUMBER_FONT = "500 26px 'Cormorant Garamond', Georgia, serif";
const MSG_SIGNATURE_COLOR = '#b8924a'; // Veloura gold
const MSG_PALETTE = {
  ink: '#3a3026',
  accent: '#b3873f',
  muted: '#9a8f7d',
  message: '#564f44',
  cardFill: '#fffefb',
  cardBorder: '#ece0cb',
};

function cardHeightForLines(lineCount) {
  return MSG_MSG_START + Math.max(0, lineCount - 1) * MSG_LINE_HEIGHT + MSG_SIG_GAP + MSG_SIG_BOTTOM;
}

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

function drawPageBase(ctx, theme, coupleNames, title, subtitle) {
  ctx.fillStyle = theme.background;
  ctx.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
  drawDecor(ctx, theme);

  ctx.textAlign = 'center';
  ctx.fillStyle = theme.ink;
  ctx.font = 'italic 44px Georgia, serif';
  drawCenteredText(ctx, coupleNames || 'Our Wedding', 126);

  ctx.fillStyle = theme.accent;
  ctx.font = '700 19px Arial, sans-serif';
  drawCenteredText(ctx, title, 178);

  ctx.fillStyle = theme.muted;
  ctx.font = 'italic 22px Georgia, serif';
  drawCenteredText(ctx, subtitle, 246);
}

function createPage(theme, coupleNames, title, subtitle) {
  const canvas = document.createElement('canvas');
  canvas.width = PAGE_WIDTH;
  canvas.height = PAGE_HEIGHT;
  const ctx = canvas.getContext('2d');
  drawPageBase(ctx, theme, coupleNames, title, subtitle);
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
        reject(new Error('Could not render the PDF.'));
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

export function buildPdfFromJpegPages(images, opts = {}) {
  const widthPx = opts.widthPx ?? PAGE_WIDTH;
  const heightPx = opts.heightPx ?? PAGE_HEIGHT;
  const widthPt = opts.widthPt ?? PDF_WIDTH;
  const heightPt = opts.heightPt ?? PDF_HEIGHT;

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
    const content = encodeAscii(`q\n${widthPt} 0 0 ${heightPt} 0 0 cm\n/Im0 Do\nQ\n`);

    objects[pageId] = encodeAscii(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${widthPt} ${heightPt}] /Resources << /XObject << /Im0 ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`);
    objects[imageId] = concatBytes([
      encodeAscii(`<< /Type /XObject /Subtype /Image /Width ${widthPx} /Height ${heightPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.length} >>\nstream\n`),
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

async function downloadPages(pages, theme, filename) {
  pages.forEach((currentPage, index) => drawFooter(currentPage, theme, index + 1, pages.length));
  const jpegPages = await Promise.all(pages.map(currentPage => canvasToJpeg(currentPage.canvas)));
  const pdfBytes = buildPdfFromJpegPages(jpegPages);
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load the keepsake artwork.'));
    img.src = src;
  });
}

function triggerDownload(pdfBytes, filename) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function truncateToWidth(ctx, text, font, maxWidth) {
  ctx.font = font;
  if (ctx.measureText(text).width <= maxWidth) return text;
  let trimmed = text;
  while (trimmed.length > 1 && ctx.measureText(`${trimmed}…`).width > maxWidth) {
    trimmed = trimmed.slice(0, -1);
  }
  return `${trimmed.trimEnd()}…`;
}

// Centered text with manual letter-spacing (robust across browsers).
function drawSpacedText(ctx, text, centerX, baseline, spacing) {
  const chars = [...text];
  const widths = chars.map(char => ctx.measureText(char).width);
  const total = widths.reduce((sum, w) => sum + w, 0) + spacing * (chars.length - 1);
  const prevAlign = ctx.textAlign;
  ctx.textAlign = 'left';
  let x = centerX - total / 2;
  chars.forEach((char, index) => {
    ctx.fillText(char, x, baseline);
    x += widths[index] + spacing;
  });
  ctx.textAlign = prevAlign;
}

// Short horizontal rule with a small diamond + dots in the middle.
function drawCenterFlourish(ctx, cx, y, palette, reach) {
  ctx.save();
  ctx.strokeStyle = palette.accent;
  ctx.fillStyle = palette.accent;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(cx - reach, y);
  ctx.lineTo(cx - 18, y);
  ctx.moveTo(cx + 18, y);
  ctx.lineTo(cx + reach, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, y - 6);
  ctx.lineTo(cx + 7, y);
  ctx.lineTo(cx, y + 6);
  ctx.lineTo(cx - 7, y);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx - 14, y, 1.7, 0, Math.PI * 2);
  ctx.arc(cx + 14, y, 1.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Single border frame with concave (inward-scooped) corners, matching the
// reference artwork — recreated in canvas so the message pages stay light.
// Each corner is a true circular arc centred on the corner point, so the
// scoop curves cleanly into the page interior.
function drawConcaveFrame(ctx, inset, radius) {
  const x0 = inset;
  const y0 = inset;
  const x1 = MSG_PAGE_W - inset;
  const y1 = MSG_PAGE_H - inset;
  const r = radius;
  ctx.beginPath();
  ctx.moveTo(x0 + r, y0);
  ctx.lineTo(x1 - r, y0);
  ctx.arc(x1, y0, r, Math.PI, Math.PI / 2, true); // top-right scoop
  ctx.lineTo(x1, y1 - r);
  ctx.arc(x1, y1, r, (Math.PI * 3) / 2, Math.PI, true); // bottom-right scoop
  ctx.lineTo(x0 + r, y1);
  ctx.arc(x0, y1, r, 0, -Math.PI / 2, true); // bottom-left scoop
  ctx.lineTo(x0, y0 + r);
  ctx.arc(x0, y0, r, Math.PI / 2, 0, true); // top-left scoop
  ctx.stroke();
}

function paintMessagesBackground(ctx) {
  ctx.fillStyle = MSG_CREAM;
  ctx.fillRect(0, 0, MSG_PAGE_W, MSG_PAGE_H);
  ctx.strokeStyle = MSG_FRAME;
  ctx.lineWidth = 1.8;
  drawConcaveFrame(ctx, 38, 42);
}

function paintArtworkPage(bgImg) {
  const canvas = document.createElement('canvas');
  canvas.width = MSG_PAGE_W;
  canvas.height = MSG_PAGE_H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = MSG_CREAM;
  ctx.fillRect(0, 0, MSG_PAGE_W, MSG_PAGE_H);
  ctx.drawImage(bgImg, 0, 0, MSG_PAGE_W, MSG_PAGE_H);
  return canvas;
}

function createMessagesPage(palette) {
  const canvas = document.createElement('canvas');
  canvas.width = MSG_PAGE_W;
  canvas.height = MSG_PAGE_H;
  const ctx = canvas.getContext('2d');
  paintMessagesBackground(ctx);
  const cx = MSG_PAGE_W / 2;

  ctx.fillStyle = palette.ink;
  ctx.font = MSG_HEADER_FONT;
  drawSpacedText(ctx, 'MESSAGES', cx, 152, 16);
  drawCenterFlourish(ctx, cx, 96, palette, 96);
  drawCenterFlourish(ctx, cx, 200, palette, 110);

  return { canvas, ctx, y: MSG_CONTENT_TOP };
}

function drawMessagesPageNumber(ctx, number, palette) {
  const cx = MSG_PAGE_W / 2;
  const y = MSG_PAGE_H - 74;
  const label = String(number).padStart(2, '0');
  ctx.textAlign = 'center';
  ctx.fillStyle = palette.ink;
  ctx.font = MSG_NUMBER_FONT;
  ctx.fillText(label, cx, y);
  const halfNum = ctx.measureText(label).width / 2;
  ctx.strokeStyle = palette.accent;
  ctx.fillStyle = palette.accent;
  ctx.lineWidth = 1.3;
  [-1, 1].forEach(dir => {
    const sx = cx + dir * (halfNum + 18);
    ctx.beginPath();
    ctx.moveTo(sx, y - 7);
    ctx.lineTo(sx + dir * 38, y - 7);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(sx + dir * 46, y - 7, 2.2, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawGuestMessageCard(page, palette, data) {
  const { ctx } = page;
  const x = MSG_MARGIN_X;
  const y = page.y;
  const width = MSG_PAGE_W - MSG_MARGIN_X * 2;
  const innerPad = 36;
  const cardHeight = cardHeightForLines(data.lines.length);

  ctx.save();
  ctx.fillStyle = palette.cardFill;
  ctx.strokeStyle = palette.cardBorder;
  ctx.lineWidth = 1.5;
  ctx.shadowColor = 'rgba(150, 120, 70, 0.12)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 4;
  ctx.beginPath();
  ctx.roundRect(x, y, width, cardHeight, 16);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = palette.cardBorder;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x, y, width, cardHeight, 16);
  ctx.stroke();

  // Message body
  ctx.textAlign = 'left';
  ctx.fillStyle = palette.message;
  ctx.font = MSG_MESSAGE_FONT;
  data.lines.forEach((line, index) => {
    ctx.fillText(line, x + innerPad, y + MSG_MSG_START + index * MSG_LINE_HEIGHT);
  });

  // Guest signature, bottom-right in Veloura gold italic
  const lastMessageBaseline = MSG_MSG_START + (data.lines.length - 1) * MSG_LINE_HEIGHT;
  ctx.textAlign = 'right';
  ctx.fillStyle = MSG_SIGNATURE_COLOR;
  ctx.font = MSG_SIGNATURE_FONT;
  ctx.fillText(`— ${data.name}`, x + width - innerPad, y + lastMessageBaseline + MSG_SIG_GAP);
  ctx.textAlign = 'left';

  page.y += cardHeight + MSG_CARD_GAP;
}

async function ensureMessagesFonts() {
  if (!document.fonts?.load) return;
  try {
    await Promise.all([MSG_HEADER_FONT, MSG_MESSAGE_FONT, MSG_SIGNATURE_FONT, MSG_NUMBER_FONT]
      .map(font => document.fonts.load(font, 'MESSAGES')));
    await document.fonts.ready;
  } catch {
    // Fall back to the serif stack if the web font can't be loaded.
  }
}

export async function buildGuestMessagesCanvases({ messages }) {
  const palette = MSG_PALETTE;
  const [coverImg, lastImg] = await Promise.all([
    loadImage(coverEmptyUrl),
    loadImage(coverLastUrl),
  ]);
  await ensureMessagesFonts();

  const contentWidth = MSG_PAGE_W - MSG_MARGIN_X * 2;
  const nameMaxWidth = contentWidth - 72;
  const messageWrapWidth = contentWidth - 72;
  const maxLinesPerCard = 26;

  const middlePages = [];
  let page = createMessagesPage(palette);
  middlePages.push(page);

  messages.forEach(message => {
    const name = truncateToWidth(page.ctx, message.guestName || 'Guest', MSG_SIGNATURE_FONT, nameMaxWidth);

    page.ctx.font = MSG_MESSAGE_FONT;
    const allLines = wrapText(page.ctx, message.message, messageWrapWidth);
    const segments = [];
    for (let index = 0; index < allLines.length; index += maxLinesPerCard) {
      segments.push(allLines.slice(index, index + maxLinesPerCard));
    }

    segments.forEach(segmentLines => {
      if (page.y + cardHeightForLines(segmentLines.length) > MSG_CONTENT_BOTTOM) {
        page = createMessagesPage(palette);
        middlePages.push(page);
      }
      drawGuestMessageCard(page, palette, { name, lines: segmentLines });
    });
  });

  // Number the interior message pages starting at 01.
  middlePages.forEach((middlePage, index) => drawMessagesPageNumber(middlePage.ctx, index + 1, palette));

  return [
    paintArtworkPage(coverImg),
    ...middlePages.map(middlePage => middlePage.canvas),
    paintArtworkPage(lastImg),
  ];
}

export async function downloadGuestMessagesPdf({ coupleNames, messages }) {
  const canvases = await buildGuestMessagesCanvases({ messages });
  const jpegPages = await Promise.all(canvases.map(canvas => canvasToJpeg(canvas)));
  const pdfBytes = buildPdfFromJpegPages(jpegPages, {
    widthPx: MSG_PAGE_W,
    heightPx: MSG_PAGE_H,
    widthPt: MSG_PAGE_W_PT,
    heightPt: MSG_PAGE_H_PT,
  });
  triggerDownload(pdfBytes, `${sanitizeFilename(coupleNames)}-guest-messages.pdf`);
}

function formatResponseStatus(attending) {
  if (attending === 'yes') return 'Attending';
  if (attending === 'no') return 'Not attending';
  return 'Maybe';
}

function formatResponseDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US');
}

const RESPONSE_TABLE_COLUMNS = [
  { label: 'Guest Name', width: 430 },
  { label: 'Status', width: 250 },
  { label: 'Guests', width: 120 },
  { label: 'Date', width: 256 },
];
const RESPONSE_TABLE_HEADER_HEIGHT = 58;
const RESPONSE_TABLE_LINE_HEIGHT = 28;

function drawResponseTableHeader(page, theme) {
  const x = PAGE_MARGIN;
  const y = page.y;
  const width = RESPONSE_TABLE_COLUMNS.reduce((sum, column) => sum + column.width, 0);

  page.ctx.fillStyle = theme.soft;
  page.ctx.strokeStyle = theme.soft;
  page.ctx.lineWidth = 2;
  page.ctx.fillRect(x, y, width, RESPONSE_TABLE_HEADER_HEIGHT);
  page.ctx.strokeRect(x, y, width, RESPONSE_TABLE_HEADER_HEIGHT);

  page.ctx.textAlign = 'left';
  page.ctx.fillStyle = theme.ink;
  page.ctx.font = '700 19px Arial, sans-serif';
  let columnX = x;
  RESPONSE_TABLE_COLUMNS.forEach(column => {
    page.ctx.fillText(column.label.toUpperCase(), columnX + 18, y + 36);
    columnX += column.width;
    if (columnX < x + width) {
      page.ctx.beginPath();
      page.ctx.moveTo(columnX, y);
      page.ctx.lineTo(columnX, y + RESPONSE_TABLE_HEADER_HEIGHT);
      page.ctx.stroke();
    }
  });

  page.y += RESPONSE_TABLE_HEADER_HEIGHT;
}

function getResponseTableRow(ctx, response) {
  ctx.font = '21px Arial, sans-serif';
  const guestLines = wrapText(ctx, response.guestName || 'Guest', RESPONSE_TABLE_COLUMNS[0].width - 36);
  if (response.plusOne && response.plusOneName) {
    guestLines.push(...wrapText(ctx, `+ ${response.plusOneName}`, RESPONSE_TABLE_COLUMNS[0].width - 36));
  }
  const cells = [
    guestLines,
    [formatResponseStatus(response.attending)],
    [`${response.guestCount || 1}`],
    [formatResponseDate(response.respondedAt) || '-'],
  ];
  const lineCount = Math.max(...cells.map(lines => lines.length));
  return { cells, height: Math.max(64, 28 + (lineCount * RESPONSE_TABLE_LINE_HEIGHT)) };
}

function drawResponseTableRow(page, theme, row, index) {
  const x = PAGE_MARGIN;
  const y = page.y;
  const width = RESPONSE_TABLE_COLUMNS.reduce((sum, column) => sum + column.width, 0);

  page.ctx.fillStyle = index % 2 === 0 ? theme.card : theme.background;
  page.ctx.strokeStyle = theme.soft;
  page.ctx.lineWidth = 2;
  page.ctx.fillRect(x, y, width, row.height);
  page.ctx.strokeRect(x, y, width, row.height);

  let columnX = x;
  row.cells.forEach((lines, columnIndex) => {
    page.ctx.textAlign = columnIndex === 2 ? 'center' : 'left';
    page.ctx.fillStyle = columnIndex === 1 ? theme.accent : theme.ink;
    page.ctx.font = `${columnIndex === 1 ? '700 ' : ''}21px Arial, sans-serif`;
    const textX = columnIndex === 2
      ? columnX + (RESPONSE_TABLE_COLUMNS[columnIndex].width / 2)
      : columnX + 18;
    lines.forEach((line, lineIndex) => {
      page.ctx.fillText(line, textX, y + 36 + (lineIndex * RESPONSE_TABLE_LINE_HEIGHT));
    });
    columnX += RESPONSE_TABLE_COLUMNS[columnIndex].width;
    if (columnX < x + width) {
      page.ctx.beginPath();
      page.ctx.moveTo(columnX, y);
      page.ctx.lineTo(columnX, y + row.height);
      page.ctx.stroke();
    }
  });

  page.y += row.height;
}

export async function downloadGuestResponsesPdf({ themeSlug, coupleNames, responses }) {
  const theme = getTheme(themeSlug);
  const title = 'GUEST RESPONSES';
  const subtitle = 'Your RSVP details at a glance';
  const pages = [];
  let page = createPage(theme, coupleNames, title, subtitle);
  pages.push(page);
  drawResponseTableHeader(page, theme);

  responses.forEach((response, index) => {
    const row = getResponseTableRow(page.ctx, response);
    if (page.y + row.height > PAGE_HEIGHT - 128) {
      page = createPage(theme, coupleNames, title, subtitle);
      pages.push(page);
      drawResponseTableHeader(page, theme);
    }
    drawResponseTableRow(page, theme, row, index);
  });

  await downloadPages(pages, theme, `${sanitizeFilename(coupleNames)}-guest-responses.pdf`);
}

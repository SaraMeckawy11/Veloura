import coverEmptyUrl from '../assets/messages/coverEmpty.png';
import coverLastUrl from '../assets/messages/coverLast.png';

const PAGE_WIDTH = 1240;
const PAGE_HEIGHT = 1754;
const PDF_WIDTH = 595.28;
const PDF_HEIGHT = 841.89;

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
const MSG_CONTENT_TOP = 104;
const MSG_CONTENT_BOTTOM = MSG_PAGE_H - 124;
const MSG_CARD_GAP = 26;
const MSG_LINE_HEIGHT = 42;
const MSG_MSG_START = 58;   // first message baseline from card top
const MSG_SIG_GAP = 52;     // last message baseline → signature baseline
const MSG_SIG_BOTTOM = 30;  // signature baseline → card bottom
// Match the rest of the site: Cormorant Garamond display serif (loaded globally).
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

// Guest responses table — same keepsake design, laid out as an elegant table.
const RESP_LABEL_FONT = "600 21px 'Cormorant Garamond', Georgia, serif";
const RESP_NAME_FONT = "600 29px 'Cormorant Garamond', Georgia, serif";
const RESP_PLUS_FONT = "italic 500 21px 'Cormorant Garamond', Georgia, serif";
const RESP_STATUS_FONT = "italic 600 26px 'Cormorant Garamond', Georgia, serif";
const RESP_CELL_FONT = "500 25px 'Cormorant Garamond', Georgia, serif";
const RESP_COLUMNS = [
  { key: 'name', label: 'Guest', width: 330, align: 'left' },
  { key: 'status', label: 'Response', width: 190, align: 'left' },
  { key: 'guests', label: 'Guests', width: 110, align: 'center' },
  { key: 'date', label: 'Date', width: 181, align: 'left' },
];
const RESP_HEADER_HEIGHT = 60;
const RESP_ROW_PAD = 22;
const RESP_LINE_HEIGHT = 30;
const RESP_STATUS_COLORS = { yes: '#7e9b76', no: '#c4727f', maybe: '#b8924a' };

function cardHeightForLines(lineCount) {
  return MSG_MSG_START + Math.max(0, lineCount - 1) * MSG_LINE_HEIGHT + MSG_SIG_GAP + MSG_SIG_BOTTOM;
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

function createFramedPage() {
  const canvas = document.createElement('canvas');
  canvas.width = MSG_PAGE_W;
  canvas.height = MSG_PAGE_H;
  const ctx = canvas.getContext('2d');
  paintMessagesBackground(ctx);
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

async function ensureKeepsakeFonts() {
  if (!document.fonts?.load) return;
  const fonts = [
    "600 29px 'Cormorant Garamond'",
    "500 25px 'Cormorant Garamond'",
    "italic 500 31px 'Cormorant Garamond'",
    "italic 600 31px 'Cormorant Garamond'",
  ];
  try {
    await Promise.all(fonts.map(font => document.fonts.load(font, 'MESSAGES')));
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
  await ensureKeepsakeFonts();

  const contentWidth = MSG_PAGE_W - MSG_MARGIN_X * 2;
  const nameMaxWidth = contentWidth - 72;
  const messageWrapWidth = contentWidth - 72;
  const maxLinesPerCard = 26;

  const middlePages = [];
  let page = createFramedPage();
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
        page = createFramedPage();
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
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getResponseGuestCount(response) {
  return response.plusOne ? 2 : 1;
}

const RESP_TABLE_X = MSG_MARGIN_X;
const RESP_TABLE_W = RESP_COLUMNS.reduce((sum, col) => sum + col.width, 0);

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

// Couple names + title block at the top of each responses page.
function drawResponsesTitle(page, palette, coupleNames, totalGuestCount) {
  const { ctx } = page;
  const cx = MSG_PAGE_W / 2;
  ctx.textAlign = 'center';

  ctx.fillStyle = palette.ink;
  ctx.font = "600 50px 'Cormorant Garamond', Georgia, serif";
  ctx.fillText(coupleNames || 'Our Wedding', cx, 150);

  ctx.fillStyle = palette.accent;
  ctx.font = "600 24px 'Cormorant Garamond', Georgia, serif";
  drawSpacedText(ctx, 'GUEST RESPONSES', cx, 198, 6);

  ctx.fillStyle = palette.muted;
  ctx.font = "italic 24px 'Cormorant Garamond', Georgia, serif";
  ctx.fillText('Your RSVP details at a glance', cx, 244);

  ctx.fillStyle = palette.accent;
  ctx.font = "600 22px 'Cormorant Garamond', Georgia, serif";
  ctx.fillText(`Total Guests: ${totalGuestCount}`, cx, 282);

  ctx.textAlign = 'left';
  page.y = 326;
}

function drawResponsesHeader(page, palette) {
  const { ctx } = page;
  const y = page.y;
  ctx.font = RESP_LABEL_FONT;
  ctx.fillStyle = palette.muted;
  let colX = RESP_TABLE_X;
  RESP_COLUMNS.forEach(col => {
    if (col.align === 'center') {
      ctx.textAlign = 'center';
      ctx.fillText(col.label.toUpperCase(), colX + col.width / 2, y + 36);
    } else {
      ctx.textAlign = 'left';
      ctx.fillText(col.label.toUpperCase(), colX + 14, y + 36);
    }
    colX += col.width;
  });
  ctx.textAlign = 'left';
  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(RESP_TABLE_X, y + RESP_HEADER_HEIGHT - 12);
  ctx.lineTo(RESP_TABLE_X + RESP_TABLE_W, y + RESP_HEADER_HEIGHT - 12);
  ctx.stroke();
  page.y += RESP_HEADER_HEIGHT;
}

function getResponseRow(ctx, response) {
  ctx.font = RESP_NAME_FONT;
  const nameLines = wrapText(ctx, response.guestName || 'Guest', RESP_COLUMNS[0].width - 24);
  const plus = response.plusOne && response.plusOneName ? `+ ${response.plusOneName}` : '';
  const lineCount = nameLines.length + (plus ? 1 : 0);
  return { nameLines, plus, response, height: 20 + lineCount * RESP_LINE_HEIGHT + 12 };
}

function drawResponseRow(page, palette, row, zebra) {
  const { ctx } = page;
  const y = page.y;
  const { response } = row;

  if (zebra) {
    ctx.fillStyle = palette.cardFill;
    ctx.fillRect(RESP_TABLE_X, y, RESP_TABLE_W, row.height);
  }

  const baseline = y + 40;
  let colX = RESP_TABLE_X;
  RESP_COLUMNS.forEach(col => {
    const centered = col.align === 'center';
    ctx.textAlign = centered ? 'center' : 'left';
    const tx = centered ? colX + col.width / 2 : colX + 14;

    if (col.key === 'name') {
      ctx.fillStyle = palette.ink;
      ctx.font = RESP_NAME_FONT;
      row.nameLines.forEach((line, i) => ctx.fillText(line, tx, baseline + i * RESP_LINE_HEIGHT));
      if (row.plus) {
        ctx.fillStyle = palette.muted;
        ctx.font = RESP_PLUS_FONT;
        ctx.fillText(row.plus, tx, baseline + row.nameLines.length * RESP_LINE_HEIGHT);
      }
    } else if (col.key === 'status') {
      ctx.fillStyle = RESP_STATUS_COLORS[response.attending] || palette.accent;
      ctx.font = RESP_STATUS_FONT;
      ctx.fillText(formatResponseStatus(response.attending), tx, baseline);
    } else if (col.key === 'plusOne') {
      ctx.fillStyle = palette.ink;
      ctx.font = RESP_CELL_FONT;
      ctx.fillText(response.attending === 'yes' && response.plusOne ? 'Yes' : '—', tx, baseline);
    } else if (col.key === 'guests') {
      ctx.fillStyle = palette.ink;
      ctx.font = RESP_CELL_FONT;
      const count = getResponseGuestCount(response);
      ctx.fillText(`${count}`, tx, baseline);
    } else {
      ctx.fillStyle = palette.muted;
      ctx.font = RESP_CELL_FONT;
      ctx.fillText(formatResponseDate(response.respondedAt) || '—', tx, baseline);
    }
    colX += col.width;
  });

  ctx.textAlign = 'left';
  ctx.strokeStyle = palette.cardBorder;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(RESP_TABLE_X, y + row.height);
  ctx.lineTo(RESP_TABLE_X + RESP_TABLE_W, y + row.height);
  ctx.stroke();

  page.y += row.height;
}

export async function buildGuestResponsesCanvases({ coupleNames, responses }) {
  const palette = MSG_PALETTE;
  await ensureKeepsakeFonts();
  const totalGuestCount = responses.reduce((sum, response) => sum + getResponseGuestCount(response), 0);

  const startPage = () => {
    const page = createFramedPage();
    drawResponsesTitle(page, palette, coupleNames, totalGuestCount);
    drawResponsesHeader(page, palette);
    return page;
  };

  const middlePages = [];
  let page = startPage();
  middlePages.push(page);

  responses.forEach((response, index) => {
    const row = getResponseRow(page.ctx, response);
    if (page.y + row.height > MSG_CONTENT_BOTTOM) {
      page = startPage();
      middlePages.push(page);
    }
    drawResponseRow(page, palette, row, index % 2 === 1);
  });

  // Guest responses are a plain table — no cover/back artwork pages.
  middlePages.forEach((middlePage, index) => drawMessagesPageNumber(middlePage.ctx, index + 1, palette));

  return middlePages.map(middlePage => middlePage.canvas);
}

export async function downloadGuestResponsesPdf({ coupleNames, responses }) {
  const canvases = await buildGuestResponsesCanvases({ coupleNames, responses });
  const jpegPages = await Promise.all(canvases.map(canvas => canvasToJpeg(canvas)));
  const pdfBytes = buildPdfFromJpegPages(jpegPages, {
    widthPx: MSG_PAGE_W,
    heightPx: MSG_PAGE_H,
    widthPt: MSG_PAGE_W_PT,
    heightPt: MSG_PAGE_H_PT,
  });
  triggerDownload(pdfBytes, `${sanitizeFilename(coupleNames)}-guest-responses.pdf`);
}

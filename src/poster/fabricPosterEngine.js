/**
 * Fabric.js Object-Oriented Scene Graph & Vector Graphics Engine for Aspen Glow Posters.
 * Provides object-oriented layer grouping, ornate Indian festive vector shapes,
 * multi-line typography, custom service icons, medallions, QR codes, and image asset caching.
 * Gracefully degrades when rendered against minimal Jest mock 2D contexts.
 */

const imageCache = new Map();

export function preloadPosterAsset(src, onLoad) {
  if (!src || typeof window === "undefined" || typeof Image === "undefined") {
    return null;
  }
  if (imageCache.has(src)) {
    const entry = imageCache.get(src);
    // Only register onLoad if the image is still loading asynchronously.
    // Never invoke onLoad when entry.loaded is already true, because the caller
    // receives entry.img synchronously as the return value!
    if (!entry.loaded && !entry.error && onLoad) {
      entry.callbacks.push(onLoad);
    }
    return entry.loaded ? entry.img : null;
  }

  const img = new Image();
  const entry = {
    img,
    loaded: false,
    error: false,
    callbacks: onLoad ? [onLoad] : [],
  };
  imageCache.set(src, entry);

  img.onload = () => {
    entry.loaded = true;
    const pending = [...entry.callbacks];
    entry.callbacks = [];
    pending.forEach((cb) => {
      try {
        cb(img);
      } catch {
        // ignore callback errors
      }
    });
  };

  img.onerror = () => {
    entry.error = true;
    entry.callbacks = [];
  };

  img.src = src;
  return null;
}

export class FabricObject {
  constructor(props = {}) {
    this.type = props.type || "object";
    this.left = Number(props.left) || 0;
    this.top = Number(props.top) || 0;
    this.width = Number(props.width) || 0;
    this.height = Number(props.height) || 0;
    this.visible = props.visible !== false;
    this.opacity = props.opacity !== undefined ? Number(props.opacity) : 1;
    this.props = props;
  }

  render(/* ctx */) {}
}

export class FabricGroup extends FabricObject {
  constructor(objects = [], props = {}) {
    super({ ...props, type: "group" });
    this.objects = Array.isArray(objects) ? [...objects] : [];
  }

  add(obj) {
    if (obj) {
      this.objects.push(obj);
    }
    return this;
  }

  getObjects() {
    return this.objects;
  }

  render(ctx) {
    if (!this.visible) return;
    const hasSave = typeof ctx.save === "function";
    if (hasSave) {
      ctx.save();
      if (typeof ctx.translate === "function" && (this.left || this.top)) {
        ctx.translate(this.left, this.top);
      }
    }
    this.objects.forEach((obj) => {
      if (obj && typeof obj.render === "function") {
        obj.render(ctx);
      }
    });
    if (hasSave && typeof ctx.restore === "function") {
      ctx.restore();
    }
  }
}

export class FabricCustomRender extends FabricObject {
  constructor(drawFn, props = {}) {
    super({ ...props, type: "custom" });
    this.drawFn = drawFn;
  }

  render(ctx) {
    if (!this.visible || typeof this.drawFn !== "function") return;
    this.drawFn(ctx, this.props);
  }
}

export class FabricStaticCanvas {
  constructor(canvasEl, { width = 1080, height = 1080 } = {}) {
    this.canvasEl = canvasEl;
    this.width = width;
    this.height = height;
    this.objects = [];
    if (this.canvasEl) {
      this.canvasEl.width = width;
      this.canvasEl.height = height;
    }
  }

  add(...objs) {
    objs.forEach((o) => {
      if (o) this.objects.push(o);
    });
    return this;
  }

  clear() {
    this.objects = [];
    return this;
  }

  getObjects() {
    return this.objects;
  }

  renderAll() {
    if (!this.canvasEl || typeof this.canvasEl.getContext !== "function") {
      return false;
    }
    let ctx = null;
    try {
      ctx = this.canvasEl.getContext("2d");
    } catch {
      ctx = null;
    }
    if (!ctx) return false;

    this.objects.forEach((obj) => {
      if (obj && typeof obj.render === "function") {
        obj.render(ctx);
      }
    });
    return true;
  }
}

// --- Safe Low-Level Canvas 2D Helpers ---

export function hasPathApi(ctx) {
  return (
    typeof ctx.beginPath === "function" &&
    typeof ctx.moveTo === "function" &&
    typeof ctx.lineTo === "function" &&
    typeof ctx.closePath === "function"
  );
}

export function createGoldGradient(ctx, x1, y1, x2, y2, fallback = "#d4af63") {
  if (typeof ctx.createLinearGradient === "function") {
    try {
      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      grad.addColorStop(0, "#b38435");
      grad.addColorStop(0.3, "#e9c97e");
      grad.addColorStop(0.5, "#fff1c1");
      grad.addColorStop(0.7, "#e2bc6b");
      grad.addColorStop(1, "#a47628");
      return grad;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

export function drawChamferedRect(
  ctx,
  x,
  y,
  w,
  h,
  chamfer = 14,
  { fill = null, stroke = "#d4af63", lineWidth = 2 } = {}
) {
  if (!hasPathApi(ctx)) {
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fillRect(x, y, w, h);
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lineWidth;
      ctx.strokeRect(x, y, w, h);
    }
    return;
  }

  const c = Math.min(chamfer, w / 4, h / 4);
  ctx.beginPath();
  ctx.moveTo(x + c, y);
  ctx.lineTo(x + w - c, y);
  ctx.lineTo(x + w, y + c);
  ctx.lineTo(x + w, y + h - c);
  ctx.lineTo(x + w - c, y + h);
  ctx.lineTo(x + c, y + h);
  ctx.lineTo(x, y + h - c);
  ctx.lineTo(x, y + c);
  ctx.closePath();

  if (fill) {
    ctx.fillStyle = fill;
    if (typeof ctx.fill === "function") ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    if (typeof ctx.stroke === "function") ctx.stroke();
  }
}

export function drawOrnateCardFrame(
  ctx,
  x,
  y,
  w,
  h,
  {
    fill = "#4e1014",
    borderColor = "#d4af63",
    chamfer = 16,
    doubleBorder = true,
  } = {}
) {
  drawChamferedRect(ctx, x, y, w, h, chamfer, {
    fill,
    stroke: borderColor,
    lineWidth: 2.5,
  });

  if (doubleBorder) {
    drawChamferedRect(ctx, x + 6, y + 6, w - 12, h - 12, Math.max(6, chamfer - 4), {
      fill: null,
      stroke: borderColor,
      lineWidth: 1,
    });
  }
}

export function buildCanvasFont({
  fontStyle = "normal",
  fontWeight = "bold",
  fontSize = 24,
  fontFamily = "Playfair Display",
} = {}) {
  const stylePart = fontStyle && fontStyle !== "normal" ? `${fontStyle} ` : "";
  const weightPart =
    fontWeight && fontWeight !== "normal" ? `${fontWeight} ` : "";
  return `${stylePart}${weightPart}${Math.round(fontSize)}px '${fontFamily}', Georgia, serif`;
}

export function estimateCanvasTextWidth(ctx, text, fontSize) {
  const str = String(text || "");
  if (!str) return 0;
  let measured = 0;
  if (typeof ctx.measureText === "function") {
    try {
      const m = ctx.measureText(str);
      if (m && typeof m.width === "number" && m.width > 0) {
        measured = m.width;
      }
    } catch {
      measured = 0;
    }
  }
  const heuristic = str.length * fontSize * 0.54;
  return Math.max(measured, heuristic);
}

export function drawFittedText(
  ctx,
  rawText,
  x,
  y,
  {
    maxWidth = 620,
    defaultSize = 44,
    minSize = 14,
    defaultFamily = "Playfair Display",
    defaultWeight = "bold",
    defaultStyle = "normal",
    defaultColor = "#f1cf85",
    align = "center",
    prefix = "",
    suffix = "",
    styleOverride = null,
  } = {}
) {
  let clean = String(rawText || "").trim();
  if (!clean) return;

  const st = styleOverride && typeof styleOverride === "object" ? styleOverride : {};
  if (st.textTransform === "uppercase") {
    clean = clean.toUpperCase();
  }

  const fullText = `${prefix}${clean}${suffix}`;
  const fontFamily = st.fontFamily || defaultFamily;
  const fontWeight = st.fontWeight || defaultWeight;
  const fontStyle = st.fontStyle || defaultStyle;
  const fillColor = st.color || defaultColor;
  const customSize = Number(st.fontSize) || 0;

  let size = customSize > 0 ? customSize : defaultSize;
  const effectiveMaxWidth = customSize > 0 ? Math.max(maxWidth, 960) : maxWidth;

  while (size > minSize) {
    ctx.font = buildCanvasFont({
      fontStyle,
      fontWeight,
      fontSize: size,
      fontFamily,
    });
    const estW = estimateCanvasTextWidth(ctx, fullText, size);
    if (estW <= effectiveMaxWidth) {
      break;
    }
    size -= 2;
  }

  ctx.font = buildCanvasFont({
    fontStyle,
    fontWeight,
    fontSize: size,
    fontFamily,
  });
  ctx.fillStyle = fillColor;
  ctx.textAlign = st.textAlign || align;
  ctx.fillText(fullText, x, y);
}

export function drawNotchedRibbon(
  ctx,
  x,
  y,
  w,
  h,
  {
    fill = "#d4af63",
    stroke = "#fff1c1",
    notch = 16,
    text = "",
    textColor = "#240a07",
    font = "italic bold 24px 'Playfair Display', Georgia, serif",
    defaultSize = 23,
    rosettes = true,
    styleOverride = null,
  } = {}
) {
  if (!hasPathApi(ctx)) {
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
  } else {
    ctx.beginPath();
    ctx.moveTo(x + notch, y);
    ctx.lineTo(x + w - notch, y);
    ctx.lineTo(x + w, y + h / 2);
    ctx.lineTo(x + w - notch, y + h);
    ctx.lineTo(x + notch, y + h);
    ctx.lineTo(x, y + h / 2);
    ctx.closePath();

    ctx.fillStyle = fill;
    if (typeof ctx.fill === "function") ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.5;
      if (typeof ctx.stroke === "function") ctx.stroke();
    }
  }

  if (text) {
    const innerMaxWidth = Math.max(120, w - notch * 2 - 26);
    const parsedSizeMatch = String(font || "").match(/(\d+)px/);
    const startSize = parsedSizeMatch ? Number(parsedSizeMatch[1]) : defaultSize;
    const isItalic = /italic/i.test(font);
    const isBold = /bold/i.test(font);

    drawFittedText(ctx, text, x + w / 2, y + h / 2 + 8, {
      maxWidth: innerMaxWidth,
      defaultSize: startSize,
      minSize: 13,
      defaultFamily: "Playfair Display",
      defaultWeight: isBold ? "bold" : "normal",
      defaultStyle: isItalic ? "italic" : "normal",
      defaultColor: textColor,
      prefix: rosettes ? "❈  " : "",
      suffix: rosettes ? "  ❈" : "",
      styleOverride,
    });
  }
}

export function drawCircle(
  ctx,
  cx,
  cy,
  r,
  { fill = null, stroke = "#d4af63", lineWidth = 2 } = {}
) {
  if (typeof ctx.beginPath === "function" && typeof ctx.arc === "function") {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    if (fill) {
      ctx.fillStyle = fill;
      if (typeof ctx.fill === "function") ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lineWidth;
      if (typeof ctx.stroke === "function") ctx.stroke();
    }
  } else if (fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  }
}

export function drawDottedLine(
  ctx,
  x1,
  y1,
  x2,
  y2,
  color = "rgba(212, 175, 99, 0.45)"
) {
  if (!hasPathApi(ctx)) return;
  if (typeof ctx.save === "function") ctx.save();
  if (typeof ctx.setLineDash === "function") ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  if (typeof ctx.stroke === "function") ctx.stroke();
  if (typeof ctx.setLineDash === "function") ctx.setLineDash([]);
  if (typeof ctx.restore === "function") ctx.restore();
}

export function drawLuxuryBackground(ctx, width, height, theme) {
  const bg = theme?.background || "#0f0506";
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  if (typeof ctx.createRadialGradient === "function") {
    try {
      const rad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.32,
        40,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.75
      );
      rad.addColorStop(0, theme?.backgroundInner || "#260b10");
      rad.addColorStop(0.6, bg);
      rad.addColorStop(1, "#080203");
      ctx.fillStyle = rad;
      ctx.fillRect(0, 0, width, height);
    } catch {
      // fallback solid fill already applied
    }
  }

  // Subtle decorative mandala watermark rings
  drawCircle(ctx, width * 0.88, height * 0.14, 120, {
    stroke: "rgba(212, 175, 99, 0.06)",
    lineWidth: 2,
  });
  drawCircle(ctx, width * 0.88, height * 0.14, 90, {
    stroke: "rgba(212, 175, 99, 0.05)",
    lineWidth: 1.5,
  });
  drawCircle(ctx, width * 0.18, height * 0.28, 130, {
    stroke: "rgba(212, 175, 99, 0.05)",
    lineWidth: 1.5,
  });

  // Outer & Inner Champagne Gold Borders
  const goldGrad = createGoldGradient(ctx, 0, 0, width, height, "#d4af63");
  ctx.strokeStyle = goldGrad;
  ctx.lineWidth = 3;
  ctx.strokeRect(14, 14, width - 28, height - 28);
  ctx.lineWidth = 1;
  ctx.strokeRect(22, 22, width - 44, height - 44);
}

export function drawCachedOrFallbackImage(
  ctx,
  src,
  x,
  y,
  w,
  h,
  onAsyncLoad,
  fallbackDraw
) {
  const img = preloadPosterAsset(src, onAsyncLoad);
  if (img && typeof ctx.drawImage === "function") {
    try {
      ctx.drawImage(img, x, y, w, h);
      return true;
    } catch {
      // fall through to vector fallback
    }
  }
  if (typeof fallbackDraw === "function") {
    fallbackDraw(ctx, x, y, w, h);
  }
  return false;
}

export function drawBrandMonogramTopLeft(
  ctx,
  x,
  y,
  w,
  h,
  brand,
  onAsyncLoad
) {
  const drawn = drawCachedOrFallbackImage(
    ctx,
    "/poster-assets/ag-logo-box.png",
    x,
    y,
    w,
    h,
    onAsyncLoad,
    () => {
      ctx.fillStyle = "#080304";
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = "#d4af63";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);

      ctx.fillStyle = "#f1cf85";
      ctx.textAlign = "center";
      ctx.font = "italic bold 64px 'Playfair Display', Georgia, serif";
      ctx.fillText("AG", x + w / 2, y + h * 0.54);

      ctx.font = "bold 18px 'Playfair Display', Georgia, serif";
      ctx.fillText("ASPEN GLOW", x + w / 2, y + h * 0.78);
      ctx.font = "12px 'Lato', sans-serif";
      ctx.fillText("BY SHILPI", x + w / 2, y + h * 0.91);
    }
  );

  // Website domain below logo box
  ctx.fillStyle = "#f5ebe6";
  ctx.font = "bold 19px 'Lato', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(
    brand?.website_domain || "aspen-glow.netlify.app",
    x + w / 2,
    y + h + 26
  );
  return drawn;
}

export function drawCircularStampBadge(
  ctx,
  cx,
  cy,
  radius,
  lines = ["GLOW", "INSIDE & OUT", "BECAUSE", "YOU DESERVE IT!"],
  styleOverride = null
) {
  drawCircle(ctx, cx, cy, radius, {
    fill: "rgba(18, 7, 9, 0.92)",
    stroke: "#d4af63",
    lineWidth: 2,
  });
  drawCircle(ctx, cx, cy, radius - 6, {
    fill: null,
    stroke: "rgba(212, 175, 99, 0.6)",
    lineWidth: 1,
  });

  const st =
    styleOverride && typeof styleOverride === "object" ? styleOverride : {};
  ctx.textAlign = "center";
  ctx.fillStyle = st.color || "#f8efe6";
  const cleanLines = Array.isArray(lines)
    ? lines
    : String(lines || "")
        .split(/\r?\n/)
        .filter(Boolean);

  const startY = cy - ((cleanLines.length - 1) * 18) / 2 - 4;
  cleanLines.forEach((rawLine, idx) => {
    const line =
      st.textTransform === "uppercase"
        ? String(rawLine).toUpperCase()
        : String(rawLine);
    const baseSize =
      Number(st.fontSize) > 0
        ? Math.min(24, Number(st.fontSize))
        : idx === 0
        ? 19
        : 14;
    ctx.font = buildCanvasFont({
      fontStyle: st.fontStyle || "normal",
      fontWeight: st.fontWeight || (idx === 0 ? "bold" : "normal"),
      fontSize: baseSize,
      fontFamily: st.fontFamily || (idx === 0 ? "Playfair Display" : "Lato"),
    });
    ctx.fillStyle = st.color || "#f8efe6";
    ctx.fillText(line, cx, startY + idx * 19);
  });

  ctx.fillStyle = "#e05368";
  ctx.font = "16px 'Lato', sans-serif";
  ctx.fillText("♥", cx, cy + radius - 16);
}

export function drawServiceBulletIcon(ctx, cx, cy, index = 0, itemText = "") {
  drawCircle(ctx, cx, cy, 17, {
    fill: "rgba(212, 175, 99, 0.16)",
    stroke: "#e2bc6b",
    lineWidth: 1.5,
  });

  const lower = String(itemText || "").toLowerCase();
  let glyph = "✦";
  if (lower.includes("thread")) glyph = "🧵";
  else if (lower.includes("wax") || lower.includes("reka") || lower.includes("rica"))
    glyph = "🍯";
  else if (lower.includes("wine")) glyph = "🍷";
  else if (lower.includes("bleach")) glyph = "🥣";
  else if (lower.includes("massag")) glyph = "💆";
  else if (lower.includes("lotus")) glyph = "🪷";
  else if (lower.includes("facial") || lower.includes("clean")) glyph = "✨";
  else if (index % 3 === 1) glyph = "✿";

  ctx.fillStyle = "#f6d896";
  ctx.font = "16px 'Lato', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(glyph, cx, cy + 6);
}

export function drawCardMedallion(
  ctx,
  cx,
  cy,
  radius,
  colIndex = 0,
  iconUrl = "",
  onAsyncLoad = null
) {
  const fills = ["#8e2430", "#221a2e", "#2d2212", "#102b23"];
  drawCircle(ctx, cx, cy, radius, {
    fill: fills[colIndex % fills.length],
    stroke: "#e2bc6b",
    lineWidth: 2,
  });
  drawCircle(ctx, cx, cy, radius - 5, {
    fill: null,
    stroke: "rgba(241, 207, 133, 0.45)",
    lineWidth: 1,
  });

  if (iconUrl) {
    const iconSize = Math.round(radius * 1.25);
    const drawn = drawCachedOrFallbackImage(
      ctx,
      iconUrl,
      cx - iconSize / 2,
      cy - iconSize / 2,
      iconSize,
      iconSize,
      onAsyncLoad
    );
    if (drawn) return;
  }

  const emblems = ["👩", "✦", "🪷", "👑"];
  ctx.fillStyle = "#f7d794";
  ctx.font = "34px 'Playfair Display', Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText(emblems[colIndex % emblems.length], cx, cy + 12);
}

export function drawTrustBar(ctx, x, y, w, h, columns = 3) {
  drawChamferedRect(ctx, x, y, w, h, 12, {
    fill: "rgba(20, 8, 10, 0.9)",
    stroke: "#d4af63",
    lineWidth: 1.8,
  });

  const items = [
    {
      icon: "🌿",
      title: "PREMIUM PRODUCTS",
      sub: "Safe & Skin Friendly",
    },
    {
      icon: "👩",
      title: "EXPERT BEAUTICIANS",
      sub: "Professional Care",
    },
    {
      icon: "🛡️",
      title: "HYGIENIC & SAFE",
      sub: "Your Safety, Our Priority",
    },
  ];

  if (columns === 4) {
    items.push({
      icon: "📅",
      title: "ADVANCE BOOKING",
      sub: "Recommended",
    });
  }

  const colW = w / items.length;
  items.forEach((it, idx) => {
    const cellX = x + idx * colW;
    if (idx > 0 && hasPathApi(ctx)) {
      ctx.beginPath();
      ctx.moveTo(cellX, y + 14);
      ctx.lineTo(cellX, y + h - 14);
      ctx.strokeStyle = "rgba(212, 175, 99, 0.45)";
      ctx.lineWidth = 1;
      if (typeof ctx.stroke === "function") ctx.stroke();
    }

    drawCircle(ctx, cellX + 42, y + h / 2, 22, {
      fill: "rgba(212, 175, 99, 0.15)",
      stroke: "#d4af63",
      lineWidth: 1.2,
    });
    ctx.fillStyle = "#e6b86a";
    ctx.font = "22px 'Lato', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(it.icon, cellX + 42, y + h / 2 + 8);

    ctx.textAlign = "left";
    ctx.fillStyle = "#f1cf85";
    ctx.font = "bold 17px 'Playfair Display', Georgia, serif";
    ctx.fillText(it.title, cellX + 74, y + h / 2 - 4);

    ctx.fillStyle = "#f5ebe6";
    ctx.font = "14px 'Lato', sans-serif";
    ctx.fillText(it.sub, cellX + 74, y + h / 2 + 18);
  });
}

export function drawDeterministicQrCode(ctx, x, y, size) {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = "#d4af63";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, size, size);

  const cells = 11;
  const pad = 6;
  const cellSize = (size - pad * 2) / cells;
  ctx.fillStyle = "#120607";

  for (let r = 0; r < cells; r += 1) {
    for (let c = 0; c < cells; c += 1) {
      const isTopLeftFinder = r < 3 && c < 3;
      const isTopRightFinder = r < 3 && c >= cells - 3;
      const isBottomLeftFinder = r >= cells - 3 && c < 3;
      const patternBit = (r * 7 + c * 13 + r * c) % 3 === 0;
      if (
        isTopLeftFinder ||
        isTopRightFinder ||
        isBottomLeftFinder ||
        patternBit
      ) {
        ctx.fillRect(
          x + pad + c * cellSize,
          y + pad + r * cellSize,
          cellSize - 0.8,
          cellSize - 0.8
        );
      }
    }
  }
}

export const DEFAULT_QR_CODE_URL = "/aspen-glow-QR-code.png";

export function drawScannableQrCode(
  ctx,
  x,
  y,
  size,
  qrCodeUrl = DEFAULT_QR_CODE_URL,
  onAsyncLoad = null
) {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = "#d4af63";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, size, size);

  drawCachedOrFallbackImage(
    ctx,
    qrCodeUrl || DEFAULT_QR_CODE_URL,
    x + 2,
    y + 2,
    size - 4,
    size - 4,
    onAsyncLoad,
    () => {
      drawDeterministicQrCode(ctx, x, y, size);
    }
  );
}

export function drawStandardFooter(
  ctx,
  x,
  y,
  w,
  {
    contact,
    ctaText = "BOOK YOUR APPOINTMENT NOW!",
    footerTagline = "THIS TEEJ, GIFT YOUR SISTER THE GLOW SHE DESERVES.",
    validityNote = "",
    showQrCode = false,
    qrCodeUrl = DEFAULT_QR_CODE_URL,
    onAsyncLoad = null,
    ctaStyle = null,
    footerTaglineStyle = null,
    validityStyle = null,
  } = {}
) {
  if (validityNote) {
    drawFittedText(ctx, validityNote, x + w / 2, y - 8, {
      maxWidth: w - 40,
      defaultSize: 15,
      minSize: 11,
      defaultFamily: "Lato",
      defaultWeight: "bold",
      defaultColor: "#f1cf85",
      styleOverride: validityStyle,
    });
  }

  // CTA Ribbon
  const ctaW = Math.min(w * 0.62, 620);
  const ctaX = x + (w - ctaW) / 2;
  drawChamferedRect(ctx, ctaX, y, ctaW, 42, 12, {
    fill: "#59131a",
    stroke: "#d4af63",
    lineWidth: 1.8,
  });
  drawFittedText(ctx, ctaText, x + w / 2, y + 28, {
    maxWidth: ctaW - 36,
    defaultSize: 20,
    minSize: 13,
    defaultFamily: "Playfair Display",
    defaultWeight: "bold",
    defaultColor: "#f3cf85",
    prefix: "❖  ",
    suffix: "  ❖",
    styleOverride: ctaStyle,
  });

  // Contact Bar Box
  const barY = y + 52;
  const barH = 82;
  drawChamferedRect(ctx, x, barY, w, barH, 12, {
    fill: "rgba(18, 7, 9, 0.94)",
    stroke: "#d4af63",
    lineWidth: 1.8,
  });

  // Phone section
  drawCircle(ctx, x + 44, barY + barH / 2, 23, {
    fill: "#e05368",
    stroke: "#f5d38c",
    lineWidth: 1.2,
  });
  ctx.fillStyle = "#140608";
  ctx.font = "bold 22px 'Lato', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("📞", x + 44, barY + barH / 2 + 8);

  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 29px 'Lato', sans-serif";
  ctx.fillText(contact?.phone || "7011413546", x + 78, barY + 38);
  ctx.fillStyle = "#ebd5c8";
  ctx.font = "17px 'Lato', sans-serif";
  ctx.fillText("(Call/WhatsApp)", x + 78, barY + 64);

  // Address section
  const addrX = x + 318;
  drawCircle(ctx, addrX + 22, barY + barH / 2, 18, {
    fill: "rgba(212, 175, 99, 0.2)",
    stroke: "#d4af63",
    lineWidth: 1.2,
  });
  ctx.textAlign = "center";
  ctx.fillStyle = "#e05368";
  ctx.font = "20px 'Lato', sans-serif";
  ctx.fillText("📍", addrX + 22, barY + barH / 2 + 7);

  const rawAddress =
    contact?.address ||
    "703 Aspen Tower, DevSai Sports Home, Sector 1, Bisrakh, Greater Noida";
  const addressParts = rawAddress.includes("Sector 1")
    ? [
        rawAddress.split("Sector 1")[0].replace(/,\s*$/, "") + ",",
        "Sector 1" + rawAddress.split("Sector 1")[1],
      ]
    : [rawAddress.slice(0, 38), rawAddress.slice(38)];

  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  ctx.font = "18px 'Lato', sans-serif";
  ctx.fillText(addressParts[0].trim(), addrX + 48, barY + 36);
  if (addressParts[1]) {
    ctx.fillText(addressParts[1].trim(), addrX + 48, barY + 62);
  }

  // Right widget: Original Scannable QR Code OR Advance Booking Recommended
  const rightX = x + w - 245;
  if (showQrCode) {
    drawScannableQrCode(ctx, rightX, barY + 7, 68, qrCodeUrl, onAsyncLoad);
    ctx.textAlign = "left";
    ctx.fillStyle = "#f1cf85";
    ctx.font = "bold 16px 'Playfair Display', Georgia, serif";
    ctx.fillText("SCAN TO", rightX + 78, barY + 36);
    ctx.fillText("BOOK NOW!", rightX + 78, barY + 58);
  } else {
    drawChamferedRect(ctx, rightX, barY + 18, 44, 44, 8, {
      fill: "#e05368",
      stroke: "#f1cf85",
      lineWidth: 1,
    });
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = "22px 'Lato', sans-serif";
    ctx.fillText("📅", rightX + 22, barY + 48);

    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    ctx.font = "17px 'Lato', sans-serif";
    ctx.fillText("Advance Booking", rightX + 54, barY + 36);
    ctx.fillText("Recommended", rightX + 54, barY + 58);
  }

  // Bottom closing tagline
  drawFittedText(ctx, footerTagline, x + w / 2, barY + barH + 30, {
    maxWidth: w - 40,
    defaultSize: 19,
    minSize: 12,
    defaultFamily: "Playfair Display",
    defaultWeight: "bold",
    defaultColor: "#e05368",
    suffix: "  ♥",
    styleOverride: footerTaglineStyle,
  });
}

export function wrapCanvasTextLines(ctx, text, maxChars = 26) {
  const words = String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return [];
  const lines = [];
  let current = words[0];
  for (let i = 1; i < words.length; i += 1) {
    if ((current + " " + words[i]).length <= maxChars) {
      current += " " + words[i];
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  lines.push(current);
  return lines;
}


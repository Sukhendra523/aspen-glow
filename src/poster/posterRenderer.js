function truncateText(text, maxChars = 54) {
  const str = String(text || "").trim();
  if (str.length <= maxChars) return str;
  return `${str.slice(0, maxChars - 1)}…`;
}

export function renderPosterToCanvas(canvas, snapshot) {
  if (!canvas || !snapshot || typeof canvas.getContext !== "function") {
    return { rendered: false };
  }

  let ctx = null;
  try {
    ctx = canvas.getContext("2d");
  } catch {
    return { rendered: false };
  }
  if (!ctx) {
    return { rendered: false };
  }

  const width = Number(snapshot.template?.width) || 1080;
  const height = Number(snapshot.template?.height) || 1080;
  canvas.width = width;
  canvas.height = height;

  const theme = snapshot.template?.theme || {};
  const bgColor = theme.background || snapshot.brand?.background_color || "#FEFBF6";
  const primaryColor = theme.primary || snapshot.brand?.primary_color || "#d81b60";
  const accentColor =
    snapshot.festival?.accent_color || theme.accent || primaryColor;
  const textPrimary = theme.textPrimary || "#2b1b22";
  const textSecondary = theme.textSecondary || "#5c434d";
  const headingFont = snapshot.brand?.heading_font || "Playfair Display";
  const bodyFont = snapshot.brand?.body_font || "Lato";

  // 1. Background fill
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  // 2. Ornamental border
  if (snapshot.template?.layout_config?.show_border !== false) {
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 8;
    ctx.strokeRect(28, 28, width - 56, height - 56);

    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(42, 42, width - 84, height - 84);
  }

  // 3. Festival Motif Pill & Brand Header
  ctx.textAlign = "center";
  ctx.fillStyle = accentColor;
  ctx.font = `bold 26px "${bodyFont}", sans-serif`;
  ctx.fillText(
    truncateText(snapshot.festival?.motif_label || "✨ Festive Special", 48),
    width / 2,
    105
  );

  ctx.fillStyle = primaryColor;
  ctx.font = `bold 48px "${headingFont}", Georgia, serif`;
  ctx.fillText(
    truncateText(snapshot.brand?.brand_name || "Aspen Glow by Shilpi", 42),
    width / 2,
    168
  );

  // 4. Campaign Headline & Subheadline
  ctx.fillStyle = textPrimary;
  ctx.font = `bold 40px "${headingFont}", Georgia, serif`;
  ctx.fillText(
    truncateText(snapshot.campaign?.headline || "", 46),
    width / 2,
    235
  );

  if (snapshot.campaign?.subheadline) {
    ctx.fillStyle = textSecondary;
    ctx.font = `24px "${bodyFont}", sans-serif`;
    ctx.fillText(
      truncateText(snapshot.campaign.subheadline, 72),
      width / 2,
      278
    );
  }

  // 5. Offering Cards
  const offerings = Array.isArray(snapshot.offerings) ? snapshot.offerings : [];
  const columns =
    Number(snapshot.template?.layout_config?.columns) === 1 ||
    offerings.length === 1
      ? 1
      : 2;
  const rows = Math.max(1, Math.ceil(offerings.length / columns));

  const gridTop = 320;
  const footerHeight = 165;
  const availableHeight = height - gridTop - footerHeight;
  const gap = 24;
  const marginX = 68;
  const totalGridWidth = width - marginX * 2;
  const cardWidth =
    columns === 1 ? totalGridWidth : (totalGridWidth - gap) / 2;
  const cardHeight = Math.min(
    320,
    Math.floor((availableHeight - gap * (rows - 1)) / rows)
  );

  offerings.forEach((offering, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const x = marginX + col * (cardWidth + gap);
    const y = gridTop + row * (cardHeight + gap);

    // Card background & top bar
    ctx.fillStyle = theme.cardBackground || "#FFFFFF";
    ctx.fillRect(x, y, cardWidth, cardHeight);

    ctx.fillStyle = primaryColor;
    ctx.fillRect(x, y, cardWidth, 8);

    ctx.strokeStyle = "#e6d7dc";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, cardWidth, cardHeight);

    // Offering title & price
    ctx.textAlign = "left";
    ctx.fillStyle = textPrimary;
    ctx.font = `bold 28px "${headingFont}", Georgia, serif`;
    ctx.fillText(
      truncateText(offering.name, columns === 1 ? 45 : 24),
      x + 24,
      y + 48
    );

    ctx.textAlign = "right";
    ctx.fillStyle = primaryColor;
    ctx.font = `bold 32px "${headingFont}", Georgia, serif`;
    ctx.fillText(
      offering.price_formatted || "",
      x + cardWidth - 24,
      y + 48
    );

    // Offering items
    ctx.textAlign = "left";
    ctx.fillStyle = textSecondary;
    ctx.font = `21px "${bodyFont}", sans-serif`;
    const items = Array.isArray(offering.items) ? offering.items : [];
    const maxItemsToDraw = Math.min(items.length, 4);
    for (let i = 0; i < maxItemsToDraw; i += 1) {
      const itemY = y + 92 + i * 34;
      if (itemY < y + cardHeight - 16) {
        ctx.fillText(
          `★ ${truncateText(items[i], columns === 1 ? 68 : 34)}`,
          x + 24,
          itemY
        );
      }
    }
  });

  // 6. Optional Validity Note & Contact Footer
  const footerTop = height - footerHeight + 20;
  ctx.textAlign = "center";

  if (snapshot.campaign?.validity_note) {
    ctx.fillStyle = accentColor;
    ctx.font = `bold 22px "${bodyFont}", sans-serif`;
    ctx.fillText(
      truncateText(snapshot.campaign.validity_note, 72),
      width / 2,
      footerTop
    );
  }

  ctx.fillStyle = primaryColor;
  ctx.fillRect(68, footerTop + 22, width - 136, 78);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = `bold 24px "${bodyFont}", sans-serif`;
  const contactLine1 = `Book Now: ${snapshot.contact?.contact_name || ""} • 📞 ${
    snapshot.contact?.phone || ""
  } • WhatsApp: ${snapshot.contact?.whatsapp || ""}`;
  ctx.fillText(truncateText(contactLine1, 76), width / 2, footerTop + 56);

  ctx.font = `20px "${bodyFont}", sans-serif`;
  ctx.fillText(
    truncateText(`📍 ${snapshot.contact?.address || ""}`, 84),
    width / 2,
    footerTop + 86
  );

  return { rendered: true, width, height };
}


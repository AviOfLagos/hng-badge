// Shared canvas rendering utilities used by both BadgeCanvas and ProgressBadgeCanvas

export const S = 1080; // canvas size

export const STYLE_CONFIG: Record<string, { src: string; overlay: number }> = {
  bg1: { src: "/bg/HNG-BG-01.jpg", overlay: 0.62 },
  bg2: { src: "/bg/HNG-BG-02.jpg", overlay: 0.42 },
  bg3: { src: "/bg/HNG-BG-03.jpg", overlay: 0.52 },
  bg4: { src: "/bg/HNG-BG-04.jpg", overlay: 0.42 },
  bg5: { src: "/bg/HNG-BG-05.jpg", overlay: 0.52 },
  bg6: { src: "/bg/HNG-BG-06.jpg", overlay: 0.42 },
};

// HNG logo SVG as data URI (cyan brackets + white HNG text — optimised for dark bg)
export const HNG_LOGO_SVG = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 78.36 24">
  <path fill="#00aeff" fill-rule="evenodd" d="M9,0H0V24H9V19.78H5.35V4.18H9Z"/>
  <path fill="#00aeff" fill-rule="evenodd" d="M15,0h9V24H15V19.78h3.65V4.18H15Z"/>
  <polygon fill="white" points="43.08 5 45.5 5 45.5 19 43.08 19 43.08 12.66 36.06 12.66 36.06 19 33.64 19 33.64 5 36.06 5 36.06 10.62 43.08 10.62 43.08 5"/>
  <polygon fill="white" points="58.86 5 61.28 5 61.28 19 57.92 19 52 7.64 52 19 49.58 19 49.58 5 53.1 5 58.86 16.04 58.86 5"/>
  <path fill="white" d="M78.36,11.62v2H75.8a2.27,2.27,0,0,1,1.26,2.08c0,2-2.12,3.54-5.28,3.54-4.32,0-7.14-2.92-7.14-7.32s2.7-7.24,7-7.24c3.4,0,5.8,1.82,5.5,5.18H74.66c.24-2.06-1.12-3.06-3-3.06-2.76,0-4.48,2-4.48,5.12s1.8,5.2,4.6,5.2c1.66,0,2.82-.7,2.82-1.8s-1.08-1.7-3-1.7v-2Z"/>
</svg>`)}`;

export function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

export function drawCornerBrackets(ctx: CanvasRenderingContext2D, lightMode = false) {
  const m = 48;
  const len = 40;
  const t = 3;
  ctx.fillStyle = lightMode ? "rgba(0, 80, 140, 0.35)" : "rgba(0, 174, 255, 0.25)";
  ctx.fillRect(m, m, len, t);
  ctx.fillRect(m, m, t, len);
  ctx.fillRect(S - m - len, m, len, t);
  ctx.fillRect(S - m - t, m, t, len);
  ctx.fillRect(m, S - m - t, len, t);
  ctx.fillRect(m, S - m - len, t, len);
  ctx.fillRect(S - m - len, S - m - t, len, t);
  ctx.fillRect(S - m - t, S - m - len, t, len);
}

export function drawDotGrid(ctx: CanvasRenderingContext2D) {
  const step = 48;
  const r = 1.5;
  ctx.fillStyle = "rgba(255, 255, 255, 0.045)";
  for (let x = step; x < S; x += step) {
    for (let y = step; y < S; y += step) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Draw background (shared between both badge types) */
export function drawBackground(
  ctx: CanvasRenderingContext2D,
  style: string,
  overlayEnabled: boolean,
  bgImg: HTMLImageElement | null,
) {
  const hasBgImage = bgImg && style !== "default";
  const lightMode = !!(hasBgImage && !overlayEnabled);

  if (hasBgImage) {
    const scale = Math.max(S / bgImg.naturalWidth, S / bgImg.naturalHeight);
    const w = bgImg.naturalWidth * scale;
    const h = bgImg.naturalHeight * scale;
    ctx.drawImage(bgImg, (S - w) / 2, (S - h) / 2, w, h);

    if (overlayEnabled) {
      const opacity = STYLE_CONFIG[style]?.overlay ?? 0.5;
      ctx.fillStyle = `rgba(3, 7, 18, ${opacity})`;
      ctx.fillRect(0, 0, S, S);
    }
  } else {
    ctx.fillStyle = "#070A14";
    ctx.fillRect(0, 0, S, S);

    const g1 = ctx.createRadialGradient(S * 0.85, S * 0.08, 0, S * 0.85, S * 0.08, S * 0.65);
    g1.addColorStop(0, "rgba(0,174,255,0.13)");
    g1.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, S, S);

    const g2 = ctx.createRadialGradient(S * 0.12, S * 0.9, 0, S * 0.12, S * 0.9, S * 0.5);
    g2.addColorStop(0, "rgba(123,47,255,0.12)");
    g2.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, S, S);

    drawDotGrid(ctx);
  }

  return lightMode;
}

/** Load an image and return a promise */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

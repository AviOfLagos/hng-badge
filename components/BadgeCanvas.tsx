"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";

export type BadgeRole = "intern" | "mentor";

export interface BadgeData {
  name: string;
  role: BadgeRole;
  track: string;
  photoDataUrl: string | null;
}

export interface BadgeCanvasRef {
  toDataURL: () => string;
}

const S = 1080; // canvas size

// HNG logo SVG as data URI (cyan brackets + white HNG text — optimised for dark bg)
const HNG_LOGO_SVG = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 78.36 24">
  <path fill="#00aeff" fill-rule="evenodd" d="M9,0H0V24H9V19.78H5.35V4.18H9Z"/>
  <path fill="#00aeff" fill-rule="evenodd" d="M15,0h9V24H15V19.78h3.65V4.18H15Z"/>
  <polygon fill="white" points="43.08 5 45.5 5 45.5 19 43.08 19 43.08 12.66 36.06 12.66 36.06 19 33.64 19 33.64 5 36.06 5 36.06 10.62 43.08 10.62 43.08 5"/>
  <polygon fill="white" points="58.86 5 61.28 5 61.28 19 57.92 19 52 7.64 52 19 49.58 19 49.58 5 53.1 5 58.86 16.04 58.86 5"/>
  <path fill="white" d="M78.36,11.62v2H75.8a2.27,2.27,0,0,1,1.26,2.08c0,2-2.12,3.54-5.28,3.54-4.32,0-7.14-2.92-7.14-7.32s2.7-7.24,7-7.24c3.4,0,5.8,1.82,5.5,5.18H74.66c.24-2.06-1.12-3.06-3-3.06-2.76,0-4.48,2-4.48,5.12s1.8,5.2,4.6,5.2c1.66,0,2.82-.7,2.82-1.8s-1.08-1.7-3-1.7v-2Z"/>
</svg>`)}`;

// ─── helpers ──────────────────────────────────────────────────────────────────

function drawRoundedRect(
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

/** Draw L-shaped corner brackets */
function drawCornerBrackets(ctx: CanvasRenderingContext2D) {
  const m = 48; // margin from edge
  const len = 40; // arm length
  const t = 3; // line thickness
  ctx.fillStyle = "rgba(0, 174, 255, 0.25)";
  // top-left
  ctx.fillRect(m, m, len, t);
  ctx.fillRect(m, m, t, len);
  // top-right
  ctx.fillRect(S - m - len, m, len, t);
  ctx.fillRect(S - m - t, m, t, len);
  // bottom-left
  ctx.fillRect(m, S - m - t, len, t);
  ctx.fillRect(m, S - m - len, t, len);
  // bottom-right
  ctx.fillRect(S - m - len, S - m - t, len, t);
  ctx.fillRect(S - m - t, S - m - len, t, len);
}

/** Subtle dot-grid texture */
function drawDotGrid(ctx: CanvasRenderingContext2D) {
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

/** Wrap text and return lines */
function wrapText(
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

// ─── main draw ────────────────────────────────────────────────────────────────

function drawBadge(
  ctx: CanvasRenderingContext2D,
  data: BadgeData,
  photoImg: HTMLImageElement | null,
  logoImg: HTMLImageElement
) {
  // ── 1. Background ──
  ctx.fillStyle = "#070A14";
  ctx.fillRect(0, 0, S, S);

  // Radial glow – blue top-right
  const g1 = ctx.createRadialGradient(S * 0.85, S * 0.08, 0, S * 0.85, S * 0.08, S * 0.65);
  g1.addColorStop(0, "rgba(0,174,255,0.13)");
  g1.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, S, S);

  // Radial glow – purple bottom-left
  const g2 = ctx.createRadialGradient(S * 0.12, S * 0.9, 0, S * 0.12, S * 0.9, S * 0.5);
  g2.addColorStop(0, "rgba(123,47,255,0.12)");
  g2.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, S, S);

  // ── 2. Dot grid ──
  drawDotGrid(ctx);

  // ── 3. Outer border ──
  drawRoundedRect(ctx, 24, 24, S - 48, S - 48, 32);
  ctx.strokeStyle = "rgba(255,255,255,0.07)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // ── 4. Corner brackets ──
  drawCornerBrackets(ctx);

  // ── 5. HNG Logo (top center) ──
  const logoW = 260;
  const logoH = logoW * (24 / 78.36);
  const logoX = (S - logoW) / 2;
  const logoY = 90;
  ctx.drawImage(logoImg, logoX, logoY, logoW, logoH);

  // "INTERNSHIP" label under logo
  ctx.font = `500 ${S * 0.022}px Arial, sans-serif`;
  ctx.fillStyle = "rgba(0,174,255,0.7)";
  ctx.textAlign = "center";
  ctx.letterSpacing = "6px";
  ctx.fillText("INTERNSHIP", S / 2, logoY + logoH + 34);
  ctx.letterSpacing = "0px";

  // ── 6. Separator line ──
  const sepY = logoY + logoH + 64;
  const sepGrad = ctx.createLinearGradient(120, 0, S - 120, 0);
  sepGrad.addColorStop(0, "rgba(0,174,255,0)");
  sepGrad.addColorStop(0.5, "rgba(0,174,255,0.35)");
  sepGrad.addColorStop(1, "rgba(0,174,255,0)");
  ctx.strokeStyle = sepGrad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(120, sepY);
  ctx.lineTo(S - 120, sepY);
  ctx.stroke();

  // ── 7. Photo circle ──
  const photoCX = S / 2;
  const photoR = S * 0.168;          // slightly smaller → more room for text below
  const photoCY = sepY + 48 + photoR; // tighter gap after separator

  // Outer glow ring
  const ringR = photoR + 24;
  const ringGrad = ctx.createLinearGradient(photoCX - ringR, photoCY - ringR, photoCX + ringR, photoCY + ringR);
  ringGrad.addColorStop(0, "#00AEFF");
  ringGrad.addColorStop(1, "#7B2FFF");
  ctx.beginPath();
  ctx.arc(photoCX, photoCY, ringR, 0, Math.PI * 2);
  ctx.strokeStyle = ringGrad;
  ctx.lineWidth = 4;
  ctx.stroke();

  // Inner ring gap (dark separator)
  ctx.beginPath();
  ctx.arc(photoCX, photoCY, photoR + 8, 0, Math.PI * 2);
  ctx.strokeStyle = "#070A14";
  ctx.lineWidth = 12;
  ctx.stroke();

  // Photo / placeholder
  ctx.save();
  ctx.beginPath();
  ctx.arc(photoCX, photoCY, photoR, 0, Math.PI * 2);
  ctx.clip();

  if (photoImg) {
    const size = Math.min(photoImg.naturalWidth, photoImg.naturalHeight);
    const sx = (photoImg.naturalWidth - size) / 2;
    const sy = (photoImg.naturalHeight - size) / 2;
    ctx.drawImage(photoImg, sx, sy, size, size, photoCX - photoR, photoCY - photoR, photoR * 2, photoR * 2);
  } else {
    // placeholder
    ctx.fillStyle = "#111827";
    ctx.fillRect(photoCX - photoR, photoCY - photoR, photoR * 2, photoR * 2);
    // head
    ctx.fillStyle = "#2d3748";
    ctx.beginPath();
    ctx.arc(photoCX, photoCY - photoR * 0.12, photoR * 0.38, 0, Math.PI * 2);
    ctx.fill();
    // body
    ctx.beginPath();
    ctx.arc(photoCX, photoCY + photoR * 0.72, photoR * 0.58, Math.PI, 0);
    ctx.fill();
  }
  ctx.restore();

  // ── 8. Role text ──
  const rolePhrase =
    data.role === "intern" ? "I AM INTERNING AT HNG" : "I AM MENTORING AT HNG";
  const textStartY = photoCY + photoR + 54;

  ctx.font = `600 ${S * 0.034}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.letterSpacing = "3px";

  // gradient text for role phrase
  const rg = ctx.createLinearGradient(S * 0.25, 0, S * 0.75, 0);
  rg.addColorStop(0, "#00AEFF");
  rg.addColorStop(1, "#a78bfa");
  ctx.fillStyle = rg;
  ctx.fillText(rolePhrase, S / 2, textStartY);
  ctx.letterSpacing = "0px";

  // ── 9. Name ──
  const nameDisplay = data.name.trim() || "Your Name";
  ctx.font = `bold ${S * 0.078}px Arial, sans-serif`;
  ctx.fillStyle = "#FFFFFF";

  const nameLines = wrapText(ctx, nameDisplay, S - 160);
  const nameLineH = S * 0.088;
  const nameStartY = textStartY + S * 0.1;
  nameLines.forEach((line, i) => {
    ctx.fillText(line, S / 2, nameStartY + i * nameLineH);
  });

  // ── 10. Track pill ──
  const trackLabel = (data.track.trim() || "").toUpperCase();
  if (trackLabel) {
    ctx.font = `600 ${S * 0.028}px Arial, sans-serif`;
    const pillW = ctx.measureText(trackLabel).width + 70;
    const pillH = S * 0.058;
    const pillX = S / 2 - pillW / 2;
    // Clamp so pill never overlaps the watermark at the bottom
    const pillY = Math.min(
      nameStartY + nameLines.length * nameLineH + 14,
      S - pillH - 80
    );

    // glassmorphism fill
    drawRoundedRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
    ctx.fillStyle = "rgba(0,174,255,0.1)";
    ctx.fill();
    drawRoundedRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
    ctx.strokeStyle = "rgba(0,174,255,0.45)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#00AEFF";
    ctx.textAlign = "center";
    ctx.letterSpacing = "2px";
    ctx.fillText(trackLabel, S / 2, pillY + pillH * 0.66);
    ctx.letterSpacing = "0px";
  }

  // ── 11. Bottom watermark ──
  ctx.font = `${S * 0.022}px Arial, sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.textAlign = "center";
  ctx.fillText("hng.tech", S / 2, S - 52);
}

// ─── component ────────────────────────────────────────────────────────────────

const BadgeCanvas = forwardRef<BadgeCanvasRef, { data: BadgeData }>(
  function BadgeCanvas({ data }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useImperativeHandle(ref, () => ({
      toDataURL: () => canvasRef.current?.toDataURL("image/png") ?? "",
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const logoImg = new Image();
      logoImg.onload = () => {
        if (data.photoDataUrl) {
          const photoImg = new Image();
          photoImg.onload = () => drawBadge(ctx, data, photoImg, logoImg);
          photoImg.src = data.photoDataUrl;
        } else {
          drawBadge(ctx, data, null, logoImg);
        }
      };
      logoImg.src = HNG_LOGO_SVG;
    }, [data]);

    return (
      <canvas
        ref={canvasRef}
        width={S}
        height={S}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
    );
  }
);

export default BadgeCanvas;

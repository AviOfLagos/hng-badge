"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import {
  S, STYLE_CONFIG, HNG_LOGO_SVG,
  drawRoundedRect, drawCornerBrackets, drawDotGrid, drawBackground, wrapText,
} from "@/lib/badge-helpers";

export type BadgeRole = "intern" | "mentor";
export type BadgeStyle = "default" | "bg1" | "bg2" | "bg3" | "bg4" | "bg5" | "bg6";

export interface BadgeData {
  name: string;
  role: BadgeRole;
  track: string;
  photoDataUrl: string | null;
  style: BadgeStyle;
  overlayEnabled: boolean;
}

export interface BadgeCanvasRef {
  toDataURL: () => string;
}

// ─── main draw ────────────────────────────────────────────────────────────────

function drawBadge(
  ctx: CanvasRenderingContext2D,
  data: BadgeData,
  photoImg: HTMLImageElement | null,
  logoImg: HTMLImageElement,
  bgImg: HTMLImageElement | null
) {
  const lightMode = drawBackground(ctx, data.style, data.overlayEnabled, bgImg);

  // ── Outer border ──
  drawRoundedRect(ctx, 24, 24, S - 48, S - 48, 32);
  ctx.strokeStyle = lightMode ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.07)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // ── Corner brackets ──
  drawCornerBrackets(ctx, lightMode);

  // ── HNG Logo (top center) ──
  const logoW = 260;
  const logoH = logoW * (24 / 78.36);
  const logoX = (S - logoW) / 2;
  const logoY = 90;
  ctx.save();
  ctx.shadowColor = "rgba(0, 174, 255, 0.45)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;
  ctx.drawImage(logoImg, logoX, logoY, logoW, logoH);
  ctx.restore();

  // "INTERNSHIP" label under logo
  ctx.font = `500 ${S * 0.022}px Arial, sans-serif`;
  ctx.fillStyle = lightMode ? "rgba(0,80,140,0.85)" : "rgba(0,174,255,0.7)";
  ctx.textAlign = "center";
  ctx.letterSpacing = "6px";
  ctx.fillText("INTERNSHIP", S / 2, logoY + logoH + 34);
  ctx.letterSpacing = "0px";

  // ── Separator line ──
  const sepY = logoY + logoH + 64;
  const sepGrad = ctx.createLinearGradient(120, 0, S - 120, 0);
  sepGrad.addColorStop(0, lightMode ? "rgba(0,80,140,0)" : "rgba(0,174,255,0)");
  sepGrad.addColorStop(0.5, lightMode ? "rgba(0,80,140,0.4)" : "rgba(0,174,255,0.35)");
  sepGrad.addColorStop(1, lightMode ? "rgba(0,80,140,0)" : "rgba(0,174,255,0)");
  ctx.strokeStyle = sepGrad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(120, sepY);
  ctx.lineTo(S - 120, sepY);
  ctx.stroke();

  // ── Photo circle ──
  const photoCX = S / 2;
  const photoR = S * 0.168;
  const photoCY = sepY + 48 + photoR;

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

  // Inner ring gap
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
    ctx.fillStyle = "#111827";
    ctx.fillRect(photoCX - photoR, photoCY - photoR, photoR * 2, photoR * 2);
    ctx.fillStyle = "#2d3748";
    ctx.beginPath();
    ctx.arc(photoCX, photoCY - photoR * 0.12, photoR * 0.38, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(photoCX, photoCY + photoR * 0.72, photoR * 0.58, Math.PI, 0);
    ctx.fill();
  }
  ctx.restore();

  // ── Role tagline ──
  const roleTagline = data.role === "intern" ? "I am interning at HNG" : "I am mentoring at HNG";
  const textStartY = photoCY + photoR + 100;

  ctx.font = `600 ${S * 0.030}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.letterSpacing = "2px";

  if (lightMode) {
    ctx.fillStyle = "#005090";
  } else {
    const rg = ctx.createLinearGradient(S * 0.25, 0, S * 0.75, 0);
    rg.addColorStop(0, "#00AEFF");
    rg.addColorStop(1, "#a78bfa");
    ctx.fillStyle = rg;
  }
  ctx.fillText(roleTagline.toUpperCase(), S / 2, textStartY);
  ctx.letterSpacing = "0px";

  // ── Name ──
  const nameDisplay = data.name.trim() || "Your Name";
  ctx.font = `bold ${S * 0.078}px Arial, sans-serif`;
  ctx.fillStyle = lightMode ? "#1a1a2e" : "#FFFFFF";

  const nameLines = wrapText(ctx, nameDisplay, S - 160);
  const nameLineH = S * 0.088;
  const nameStartY = textStartY + S * 0.09;
  nameLines.forEach((line, i) => {
    ctx.fillText(line, S / 2, nameStartY + i * nameLineH);
  });

  // ── Track pill ──
  const trackLabel = (data.track.trim() || "").toUpperCase();
  if (trackLabel) {
    ctx.font = `600 ${S * 0.034}px Arial, sans-serif`;
    const pillW = ctx.measureText(trackLabel).width + 90;
    const pillH = S * 0.072;
    const pillX = S / 2 - pillW / 2;
    const pillY = Math.min(
      nameStartY + nameLines.length * nameLineH - 40,
      S - pillH - 80
    );

    drawRoundedRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
    ctx.fillStyle = lightMode ? "rgba(0,80,140,0.12)" : "rgba(0,174,255,0.1)";
    ctx.fill();
    drawRoundedRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
    ctx.strokeStyle = lightMode ? "rgba(0,80,140,0.5)" : "rgba(0,174,255,0.45)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = lightMode ? "#005090" : "#00AEFF";
    ctx.textAlign = "center";
    ctx.letterSpacing = "2px";
    ctx.fillText(trackLabel, S / 2, pillY + pillH * 0.66);
    ctx.letterSpacing = "0px";
  }

  // ── Bottom watermark ──
  ctx.font = `${S * 0.022}px Arial, sans-serif`;
  ctx.fillStyle = lightMode ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.2)";
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

      const styleConfig = data.style !== "default" ? STYLE_CONFIG[data.style] : null;
      const loaded: { logo?: HTMLImageElement; photo?: HTMLImageElement; bg?: HTMLImageElement } = {};
      let remaining = 1;
      if (styleConfig) remaining++;
      if (data.photoDataUrl) remaining++;

      const tryDraw = () => {
        remaining--;
        if (remaining === 0) {
          drawBadge(ctx, data, loaded.photo ?? null, loaded.logo!, loaded.bg ?? null);
        }
      };

      const logoImg = new Image();
      logoImg.onload = () => { loaded.logo = logoImg; tryDraw(); };
      logoImg.src = HNG_LOGO_SVG;

      if (styleConfig) {
        const bgImg = new Image();
        bgImg.onload = () => { loaded.bg = bgImg; tryDraw(); };
        bgImg.src = styleConfig.src;
      }

      if (data.photoDataUrl) {
        const photoImg = new Image();
        photoImg.onload = () => { loaded.photo = photoImg; tryDraw(); };
        photoImg.src = data.photoDataUrl;
      }
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

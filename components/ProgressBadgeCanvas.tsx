"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import type { BadgeRole, BadgeStyle, BadgeCanvasRef } from "@/components/BadgeCanvas";
import {
  S, STYLE_CONFIG, HNG_LOGO_SVG,
  drawRoundedRect, drawCornerBrackets, drawBackground, wrapText, loadImage,
} from "@/lib/badge-helpers";

// HNG stage schedule — auto-determines current stage from date
const STAGE_SCHEDULE = [
  { stage: 0, start: "2026-04-10", end: "2026-04-16" },
  { stage: 1, start: "2026-04-14", end: "2026-04-18" },
  { stage: 2, start: "2026-04-20", end: "2026-04-23" },
  { stage: 3, start: "2026-04-25", end: "2026-04-29" },
  { stage: 4, start: "2026-05-01", end: "2026-05-06" },
  { stage: 5, start: "2026-05-08", end: "2026-05-13" },
  { stage: 6, start: "2026-05-15", end: "2026-05-20" },
  { stage: 7, start: "2026-05-22", end: "2026-05-27" },
  { stage: "break", start: "2026-05-25", end: "2026-05-27", label: "Mentor's Break" },
  { stage: 8, start: "2026-05-29", end: "2026-06-02" },
  { stage: 9, start: "2026-06-03", end: "2026-06-06" },
] as const;

export function getCurrentStage(): { label: string; num: number | null } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Walk backwards to find the latest stage whose start date has passed
  for (let i = STAGE_SCHEDULE.length - 1; i >= 0; i--) {
    const s = STAGE_SCHEDULE[i];
    const start = new Date(s.start + "T00:00:00");
    const end = new Date(s.end + "T23:59:59");
    if (today >= start && today <= end) {
      if (s.stage === "break") return { label: "Mentor's Break", num: null };
      return { label: `Stage ${s.stage}`, num: s.stage };
    }
  }
  // Between stages — find the next upcoming stage
  for (const s of STAGE_SCHEDULE) {
    const start = new Date(s.start + "T00:00:00");
    if (today < start) {
      if (s.stage === "break") return { label: "Mentor's Break", num: null };
      return { label: `Stage ${s.stage}`, num: s.stage };
    }
  }
  return { label: "Stage 9", num: 9 };
}

export const TEXT_COLORS = [
  // Row 1
  { id: "white", value: "#FFFFFF", label: "White" },
  { id: "darktext", value: "#1a1a2e", label: "Dark" },
  { id: "cyan", value: "#00EAFF", label: "Cyan" },
  { id: "mint", value: "#5FFFB0", label: "Mint" },
  { id: "gold", value: "#FFD966", label: "Gold" },
  { id: "coral", value: "#FF6B6B", label: "Coral" },
  { id: "lavender", value: "#C4B5FD", label: "Lavender" },
  { id: "lime", value: "#BFFF00", label: "Lime" },
  // Row 2
  { id: "peach", value: "#FFAB91", label: "Peach" },
  { id: "hotpink", value: "#FF69B4", label: "Hot Pink" },
  { id: "ice", value: "#A5F3FC", label: "Ice" },
  { id: "amber", value: "#FBBF24", label: "Amber" },
  { id: "rose", value: "#FB7185", label: "Rose" },
  { id: "violet", value: "#A78BFA", label: "Violet" },
  { id: "teal", value: "#2DD4BF", label: "Teal" },
  { id: "orange", value: "#FB923C", label: "Orange" },
] as const;

export type TextColorId = (typeof TEXT_COLORS)[number]["id"];

export interface ProgressBadgeData {
  updateText: string;
  dayNumber: number;
  name: string;
  role: BadgeRole;
  track: string;
  photoDataUrl: string | null;
  style: BadgeStyle;
  overlayEnabled: boolean;
  textColor: TextColorId;
  textSize: number; // 0–100 slider, maps to font multiplier
}

// ─── draw function (exported for GIF encoder) ────────────────────────────────

export function drawProgressBadge(
  ctx: CanvasRenderingContext2D,
  data: ProgressBadgeData,
  photoImg: HTMLImageElement | null,
  logoImg: HTMLImageElement,
  bgImg: HTMLImageElement | null,
  /** 0→1 progress for animation; 1 = fully visible (default) */
  progress = 1,
) {
  const canvasSize = ctx.canvas.width;
  const scale = canvasSize / S;
  ctx.save();
  ctx.scale(scale, scale);

  // ── Background ──
  const bgAlpha = Math.min(1, progress / 0.18);
  ctx.globalAlpha = bgAlpha;
  const lightMode = drawBackground(ctx, data.style, data.overlayEnabled, bgImg);
  ctx.globalAlpha = bgAlpha;

  // ── Outer border + brackets ──
  drawRoundedRect(ctx, 24, 24, S - 48, S - 48, 32);
  ctx.strokeStyle = lightMode ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.07)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  drawCornerBrackets(ctx, lightMode);
  ctx.globalAlpha = 1;

  // ── Top bar: Logo (left) + DAY pill (right) ──
  const topBarAlpha = Math.max(0, Math.min(1, (progress - 0.18) / 0.15));
  if (topBarAlpha > 0) {
    ctx.globalAlpha = topBarAlpha;

    // Logo (smaller, left-aligned)
    const logoW = 160;
    const logoH = logoW * (24 / 78.36);
    ctx.save();
    ctx.shadowColor = "rgba(0, 174, 255, 0.35)";
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 3;
    ctx.drawImage(logoImg, 80, 72, logoW, logoH);
    ctx.restore();

    // DAY + STAGE pill (right)
    const dayText = `DAY ${data.dayNumber}`;
    const stageInfo = getCurrentStage();
    ctx.font = `700 ${S * 0.022}px Arial, sans-serif`;
    const pillText = `${dayText}  ·  ${stageInfo.label.toUpperCase()}`;
    const dayW = ctx.measureText(pillText).width + 44;
    const dayH = 44;
    const dayX = S - 80 - dayW;
    const dayY = 68;
    drawRoundedRect(ctx, dayX, dayY, dayW, dayH, dayH / 2);
    ctx.fillStyle = lightMode ? "rgba(0,80,140,0.15)" : "rgba(0,174,255,0.15)";
    ctx.fill();
    drawRoundedRect(ctx, dayX, dayY, dayW, dayH, dayH / 2);
    ctx.strokeStyle = lightMode ? "rgba(0,80,140,0.4)" : "rgba(0,174,255,0.35)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "#00AEFF";
    ctx.textAlign = "center";
    ctx.fillText(pillText, dayX + dayW / 2, dayY + dayH * 0.66);
    ctx.textAlign = "left";
    ctx.globalAlpha = 1;
  }

  // ── Separator line under top bar ──
  const sepY = 140;
  if (topBarAlpha > 0) {
    ctx.globalAlpha = topBarAlpha;
    const sepGrad = ctx.createLinearGradient(80, 0, S - 80, 0);
    sepGrad.addColorStop(0, lightMode ? "rgba(0,80,140,0)" : "rgba(0,174,255,0)");
    sepGrad.addColorStop(0.5, lightMode ? "rgba(0,80,140,0.3)" : "rgba(0,174,255,0.25)");
    sepGrad.addColorStop(1, lightMode ? "rgba(0,80,140,0)" : "rgba(0,174,255,0)");
    ctx.strokeStyle = sepGrad;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(80, sepY);
    ctx.lineTo(S - 80, sepY);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // ── Hero text (update) ──
  const textProgress = Math.max(0, Math.min(1, (progress - 0.33) / 0.29));
  if (textProgress > 0) {
    const updateDisplay = data.updateText.trim() || "What are you working on?";
    const maxW = S - 160;
    const pad = 80;

    // Available vertical zone: between top bar area and byline
    const zoneTop = sepY + 20;
    const zoneBottom = S - 200; // above byline
    const zoneH = zoneBottom - zoneTop;

    // Font size from slider: 0→100 maps to fixed pixel sizes 32→72
    const fontSize = Math.round(32 + (data.textSize / 100) * 40);
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    const lines = wrapText(ctx, updateDisplay, maxW);
    const lineH = fontSize * 1.35;

    // Label height
    const labelFontSize = S * 0.020;
    const labelH = labelFontSize + 16; // label + gap

    // Total content height: label + text block
    const textBlockH = lines.length * lineH;
    const totalContentH = labelH + textBlockH;

    // Center the entire content block vertically in the zone
    const contentTop = zoneTop + (zoneH - totalContentH) / 2;

    // "What I'm working on" label
    ctx.font = `500 ${labelFontSize}px Arial, sans-serif`;
    ctx.fillStyle = lightMode ? "rgba(0,80,140,0.6)" : "rgba(0,174,255,0.5)";
    ctx.textAlign = "left";
    ctx.letterSpacing = "2px";
    ctx.fillText("WHAT I'M WORKING ON", pad, contentTop + labelFontSize);
    ctx.letterSpacing = "0px";

    // Hero text — vertically centered, left aligned
    const heroStartY = contentTop + labelH + fontSize * 0.85; // baseline of first line

    // For animation: show partial characters
    const totalChars = updateDisplay.length;
    const visibleChars = Math.ceil(totalChars * textProgress);
    const visibleText = updateDisplay.slice(0, visibleChars);
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    const visibleLines = wrapText(ctx, visibleText, maxW);

    // Text color from palette — same color regardless of overlay state
    const colorEntry = TEXT_COLORS.find((c) => c.id === data.textColor);
    ctx.fillStyle = colorEntry?.value ?? "#FFFFFF";
    ctx.textAlign = "left";
    visibleLines.forEach((line, i) => {
      ctx.fillText(line, pad, heroStartY + i * lineH);
    });
  }

  // ── Bottom byline ──
  const bylineProgress = Math.max(0, Math.min(1, (progress - 0.62) / 0.22));
  if (bylineProgress > 0) {
    const bylineY = S - 160;
    // Slide up from bottom
    const slideOffset = (1 - bylineProgress) * 60;
    const currentY = bylineY + slideOffset;
    ctx.globalAlpha = bylineProgress;

    // Separator above byline
    const bSepGrad = ctx.createLinearGradient(80, 0, S - 80, 0);
    bSepGrad.addColorStop(0, lightMode ? "rgba(0,80,140,0)" : "rgba(255,255,255,0)");
    bSepGrad.addColorStop(0.5, lightMode ? "rgba(0,80,140,0.2)" : "rgba(255,255,255,0.06)");
    bSepGrad.addColorStop(1, lightMode ? "rgba(0,80,140,0)" : "rgba(255,255,255,0)");
    ctx.strokeStyle = bSepGrad;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(80, currentY - 20);
    ctx.lineTo(S - 80, currentY - 20);
    ctx.stroke();

    // Photo circle (small)
    const photoR = 40;
    const photoCX = 80 + photoR;
    const photoCY = currentY + photoR;

    ctx.save();
    ctx.beginPath();
    ctx.arc(photoCX, photoCY, photoR, 0, Math.PI * 2);
    ctx.strokeStyle = lightMode ? "rgba(0,80,140,0.4)" : "rgba(0,174,255,0.4)";
    ctx.lineWidth = 2;
    ctx.stroke();
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

    // Name + role text
    const textX = photoCX + photoR + 16;
    ctx.fillStyle = lightMode ? "#1a1a2e" : "#FFFFFF";
    ctx.font = `600 ${S * 0.024}px Arial, sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText(data.name.trim() || "Your Name", textX, currentY + 32);

    ctx.fillStyle = lightMode ? "#005090" : "#888";
    ctx.font = `${S * 0.018}px Arial, sans-serif`;
    const roleLabel = data.role === "intern" ? "Intern" : "Mentor";
    ctx.fillText(roleLabel, textX, currentY + 60);

    // Track pill (right side)
    const trackLabel = (data.track.trim() || "").toUpperCase();
    if (trackLabel) {
      ctx.font = `600 ${S * 0.018}px Arial, sans-serif`;
      const pillW = ctx.measureText(trackLabel).width + 40;
      const pillH = 36;
      const pillX = S - 80 - pillW;
      const pillY = currentY + 20;
      drawRoundedRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
      ctx.fillStyle = lightMode ? "rgba(0,80,140,0.12)" : "rgba(0,174,255,0.1)";
      ctx.fill();
      drawRoundedRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
      ctx.strokeStyle = lightMode ? "rgba(0,80,140,0.5)" : "rgba(0,174,255,0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = lightMode ? "#005090" : "#00AEFF";
      ctx.textAlign = "center";
      ctx.fillText(trackLabel, pillX + pillW / 2, pillY + pillH * 0.66);
    }

    ctx.globalAlpha = 1;
  }

  // ── Watermark ──
  if (progress > 0.84) {
    ctx.font = `${S * 0.020}px Arial, sans-serif`;
    ctx.fillStyle = lightMode ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.15)";
    ctx.textAlign = "center";
    ctx.fillText("hng.tech", S / 2, S - 44);
  }

  ctx.restore();
}

// ─── component ────────────────────────────────────────────────────────────────

const ProgressBadgeCanvas = forwardRef<BadgeCanvasRef, { data: ProgressBadgeData }>(
  function ProgressBadgeCanvas({ data }, ref) {
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
      const promises: Promise<HTMLImageElement>[] = [loadImage(HNG_LOGO_SVG)];
      if (styleConfig) promises.push(loadImage(styleConfig.src));
      if (data.photoDataUrl) promises.push(loadImage(data.photoDataUrl));

      Promise.all(promises).then(([logoImg, ...rest]) => {
        let bgImg: HTMLImageElement | null = null;
        let photoImg: HTMLImageElement | null = null;
        let idx = 0;
        if (styleConfig) bgImg = rest[idx++] ?? null;
        if (data.photoDataUrl) photoImg = rest[idx] ?? null;
        drawProgressBadge(ctx, data, photoImg, logoImg, bgImg);
      });
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

export default ProgressBadgeCanvas;

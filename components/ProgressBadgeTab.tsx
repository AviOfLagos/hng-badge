"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import type { BadgeCanvasRef, BadgeStyle } from "@/components/BadgeCanvas";
import type { ProgressBadgeData, TextColorId } from "@/components/ProgressBadgeCanvas";
import { drawProgressBadge, TEXT_COLORS } from "@/components/ProgressBadgeCanvas";
import { loadProfile } from "@/lib/storage";
import { STYLE_CONFIG, HNG_LOGO_SVG, loadImage } from "@/lib/badge-helpers";
import { encodeGif } from "@/lib/gif-encoder";
import SharePanel from "@/components/SharePanel";

const ProgressBadgeCanvas = dynamic(
  () => import("@/components/ProgressBadgeCanvas"),
  { ssr: false }
);

const HNG_START = new Date("2026-04-10T00:00:00").getTime();

function getDayNumber() {
  return Math.max(0, Math.floor((Date.now() - HNG_START) / 86400000));
}

type GifStatus = "idle" | "generating" | "ready" | "downloading" | "error";

export default function ProgressBadgeTab() {
  const [updateText, setUpdateText] = useState("");
  const [exportMode, setExportMode] = useState<"picture" | "gif">("picture");
  const [gifStatus, setGifStatus] = useState<GifStatus>("idle");
  const [gifPreviewUrl, setGifPreviewUrl] = useState<string | null>(null);
  const [style, setStyle] = useState<BadgeStyle>("default");
  const [overlayEnabled, setOverlayEnabled] = useState(true);
  const [textColor, setTextColor] = useState<TextColorId>("white");
  const [textSize, setTextSize] = useState(50); // 0–100 → maps to 32px–72px

  const profile = typeof window !== "undefined" ? loadProfile() : null;
  const canvasRef = useRef<BadgeCanvasRef>(null);
  const gifBlobRef = useRef<Blob | null>(null);

  // Load saved style preference from profile
  useEffect(() => {
    const p = loadProfile();
    if (p) {
      setStyle(p.style);
      setOverlayEnabled(p.overlayEnabled);
    }
  }, []);

  // Clean up GIF preview URL on unmount or when regenerating
  useEffect(() => {
    return () => {
      if (gifPreviewUrl) URL.revokeObjectURL(gifPreviewUrl);
    };
  }, [gifPreviewUrl]);

  // Reset GIF preview when inputs change
  useEffect(() => {
    if (gifPreviewUrl) {
      URL.revokeObjectURL(gifPreviewUrl);
      setGifPreviewUrl(null);
      setGifStatus("idle");
      gifBlobRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateText, style, overlayEnabled, textColor, textSize]);

  const dayNumber = getDayNumber();

  const badgeData: ProgressBadgeData = {
    updateText,
    dayNumber,
    name: profile?.name ?? "",
    role: profile?.role ?? "intern",
    track: profile?.track ?? "",
    photoDataUrl: profile?.photoDataUrl ?? null,
    style,
    overlayEnabled,
    textColor,
    textSize,
  };

  // Generate GIF for preview
  const handleGenerateGif = useCallback(async () => {
    setGifStatus("generating");
    try {
      const logoImg = await loadImage(HNG_LOGO_SVG);
      const styleConfig = style !== "default" ? STYLE_CONFIG[style] : null;
      const bgImg = styleConfig ? await loadImage(styleConfig.src) : null;
      const photoImg = badgeData.photoDataUrl
        ? await loadImage(badgeData.photoDataUrl)
        : null;

      const dataSnapshot = { ...badgeData };

      // Calculate frame count based on text length for readable pacing
      // Base: 30 frames for intro (bg + logo + label), then ~2 frames per character for typing,
      // then 15 frames for byline, then hold frames so viewer can read the full text
      const textLen = Math.max(1, dataSnapshot.updateText.trim().length);
      const introFrames = 20;                         // bg + logo + "what I'm working on"
      const typingFrames = Math.max(20, textLen * 2); // ~2 frames per char
      const bylineFrames = 12;                        // slide up
      const holdFrames = Math.max(30, textLen);       // hold so people can read — longer text = longer hold
      const totalFrames = introFrames + typingFrames + bylineFrames + holdFrames;

      const gifBlob = await encodeGif({
        width: 540,
        height: 540,
        fps: 15,
        totalFrames,
        drawFrame: (ctx, progress) => {
          // Remap progress to give more time to typing and hold phases
          const animEnd = 1 - (holdFrames / totalFrames); // where animation ends and hold begins
          const mappedProgress = progress <= animEnd
            ? progress / animEnd // 0→1 over the animation portion
            : 1;                 // hold at 1 for remaining frames
          drawProgressBadge(ctx, dataSnapshot, photoImg, logoImg, bgImg, mappedProgress);
        },
      });

      gifBlobRef.current = gifBlob;
      const url = URL.createObjectURL(gifBlob);
      setGifPreviewUrl(url);
      setGifStatus("ready");
    } catch (err) {
      console.error("GIF generation failed:", err);
      setGifStatus("error");
      setTimeout(() => setGifStatus("idle"), 3000);
    }
  }, [badgeData, style]);

  // Download the already-generated GIF
  const handleDownloadGif = useCallback(() => {
    if (!gifBlobRef.current) return;
    setGifStatus("downloading");
    const url = URL.createObjectURL(gifBlobRef.current);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hng-progress-day${dayNumber}.gif`;
    a.click();
    URL.revokeObjectURL(url);
    setTimeout(() => setGifStatus("ready"), 1000);
  }, [dayNumber]);

  const handleDownloadPng = useCallback(() => {
    const dataUrl = canvasRef.current?.toDataURL();
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `hng-progress-day${dayNumber}.png`;
    a.click();
  }, [dayNumber]);

  const handleDownload = useCallback(() => {
    if (exportMode === "gif") {
      if (gifStatus === "ready") {
        handleDownloadGif();
      } else {
        handleGenerateGif();
      }
    } else {
      handleDownloadPng();
    }
  }, [exportMode, gifStatus, handleDownloadGif, handleGenerateGif, handleDownloadPng]);

  const downloadLabel = (() => {
    if (exportMode === "picture") return "Download Badge";
    switch (gifStatus) {
      case "generating": return "Creating GIF...";
      case "ready": return "Download GIF";
      case "downloading": return "Downloading...";
      case "error": return "Failed — try again";
      default: return "Download GIF";
    }
  })();

  if (!profile) {
    return (
      <div className="w-full max-w-4xl text-center py-20">
        <div className="text-gray-400 text-lg mb-2">No profile found</div>
        <p className="text-gray-600 text-sm">
          Switch to the <span className="text-[#00AEFF]">HNG Badge</span> tab and create your badge first to set up your profile.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl flex flex-col lg:flex-row gap-8 items-start justify-center">
      {/* Form */}
      <div className="w-full lg:w-80 shrink-0 bg-gray-900 rounded-2xl p-6 space-y-5 border border-gray-800">
        {/* Profile summary */}
        <div className="flex items-center gap-3">
          {profile.photoDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.photoDataUrl}
              alt=""
              className="w-10 h-10 rounded-full object-cover border-2 border-[#00AEFF]/30"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-800 border-2 border-gray-700" />
          )}
          <div>
            <div className="text-white text-sm font-semibold">{profile.name || "Your Name"}</div>
            <div className="text-gray-500 text-xs">
              {profile.role === "intern" ? "Intern" : "Mentor"}
              {profile.track ? ` · ${profile.track}` : ""}
            </div>
          </div>
        </div>

        {/* Update text */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            What I&apos;m working on
          </label>
          <textarea
            value={updateText}
            onChange={(e) => setUpdateText(e.target.value.slice(0, 280))}
            placeholder="Built my first REST API today..."
            rows={4}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#00AEFF] transition-colors text-sm resize-none"
          />
          <div className="text-right text-xs text-gray-600 mt-1">
            {updateText.length}/280
          </div>
        </div>

        {/* Text color */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Text Color
          </label>
          <div className="flex gap-2 flex-wrap">
            {TEXT_COLORS.map((c) => (
              <button
                type="button"
                key={c.id}
                onClick={() => setTextColor(c.id)}
                title={c.label}
                className={`w-7 h-7 rounded-full border-2 transition-all ${
                  textColor === c.id
                    ? "border-[#00AEFF] scale-110"
                    : "border-gray-600 hover:border-gray-400"
                }`}
                style={{ backgroundColor: c.value }}
              />
            ))}
          </div>
        </div>

        {/* Text size */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Text Size
          </label>
          <div className="flex items-center gap-3">
            <span className="text-gray-500 text-xs">A</span>
            <input
              type="range"
              min={0}
              max={100}
              value={textSize}
              onChange={(e) => setTextSize(Number(e.target.value))}
              className="flex-1 h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer accent-[#00AEFF]"
            />
            <span className="text-gray-500 text-sm font-bold">A</span>
          </div>
        </div>

        {/* Export mode toggle */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Export as
          </label>
          <div className="flex rounded-xl overflow-hidden border border-gray-700">
            {(["picture", "gif"] as const).map((mode) => (
              <button
                type="button"
                key={mode}
                onClick={() => setExportMode(mode)}
                className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                  exportMode === mode
                    ? "bg-[#00AEFF] text-white"
                    : "bg-gray-800 text-gray-400 hover:text-white"
                }`}
              >
                {mode === "picture" ? "Picture" : "GIF"}
              </button>
            ))}
          </div>
        </div>

        {/* Download */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleDownload}
            disabled={gifStatus === "generating" || gifStatus === "downloading"}
            className="w-full py-3 rounded-xl bg-[#00AEFF] hover:bg-[#00c8ff] active:bg-[#0090dd] text-white font-semibold text-sm transition-colors disabled:opacity-60"
          >
            {downloadLabel}
          </button>
        </div>

        {/* Share panel */}
        <div className="border-t border-gray-800 pt-4">
          <SharePanel role={profile.role} badgeName={profile.name} canvasRef={canvasRef} />
        </div>
      </div>

      {/* Preview */}
      <div className="flex-1 flex flex-col items-center">
        <div className="relative w-full max-w-sm lg:max-w-md aspect-square rounded-2xl overflow-hidden shadow-2xl shadow-orange-900/20 border border-gray-800">
          {/* Static canvas preview (always rendered underneath) */}
          <ProgressBadgeCanvas ref={canvasRef} data={badgeData} />

          {/* GIF preview overlay — shows the animated GIF once generated */}
          {gifPreviewUrl && exportMode === "gif" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={gifPreviewUrl}
              alt="Animated badge preview"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {/* Play button — click to generate & preview GIF */}
          {exportMode === "gif" && !gifPreviewUrl && (
            <button
              type="button"
              onClick={handleGenerateGif}
              disabled={gifStatus === "generating"}
              className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors cursor-pointer"
            >
              {gifStatus === "generating" ? (
                <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-black/60 transition-colors">
                  <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7 ml-1">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              )}
            </button>
          )}
        </div>

        {/* GIF preview hint */}
        {exportMode === "gif" && !gifPreviewUrl && gifStatus !== "generating" && (
          <p className="text-[#00AEFF] text-xs mt-2">Click play to preview the animation</p>
        )}

        {/* Background selector */}
        <div className="flex gap-2 flex-wrap justify-center mt-4">
          <button
            type="button"
            onClick={() => setStyle("default")}
            className={`shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-colors ${
              style === "default" ? "border-[#00AEFF]" : "border-gray-700 hover:border-gray-500"
            }`}
          >
            <div className="w-full h-full bg-gradient-to-br from-[#070A14] via-[#0a1628] to-[#0d1117]" />
          </button>
          {([1, 2, 3, 4, 5, 6] as const).map((n) => {
            const key = `bg${n}` as BadgeStyle;
            return (
              <button
                type="button"
                key={key}
                onClick={() => setStyle(key)}
                className={`shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-colors ${
                  style === key ? "border-[#00AEFF]" : "border-gray-700 hover:border-gray-500"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/bg/HNG-BG-0${n}.jpg`}
                  alt={`Style ${n}`}
                  className="w-full h-full object-cover"
                />
              </button>
            );
          })}
        </div>

        {/* Overlay toggle */}
        {style !== "default" && (
          <label className="flex items-center gap-2 mt-3 cursor-pointer select-none">
            <button
              type="button"
              role="switch"
              aria-checked={overlayEnabled}
              onClick={() => setOverlayEnabled((v) => !v)}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                overlayEnabled ? "bg-[#00AEFF]" : "bg-gray-600"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  overlayEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <span className="text-sm text-gray-400">Dark overlay</span>
          </label>
        )}

        <p className="text-gray-600 text-xs mt-3">Live preview — updates as you type</p>
      </div>
    </div>
  );
}

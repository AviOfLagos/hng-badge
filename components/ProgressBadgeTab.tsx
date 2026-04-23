"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import type { BadgeCanvasRef, BadgeStyle } from "@/components/BadgeCanvas";
import type { ProgressBadgeData } from "@/components/ProgressBadgeCanvas";
import { drawProgressBadge } from "@/components/ProgressBadgeCanvas";
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

type GifStatus = "idle" | "encoding" | "error";

export default function ProgressBadgeTab() {
  const [updateText, setUpdateText] = useState("");
  const [exportMode, setExportMode] = useState<"picture" | "gif">("picture");
  const [gifStatus, setGifStatus] = useState<GifStatus>("idle");
  const [style, setStyle] = useState<BadgeStyle>("default");
  const [overlayEnabled, setOverlayEnabled] = useState(true);

  const profile = typeof window !== "undefined" ? loadProfile() : null;
  const canvasRef = useRef<BadgeCanvasRef>(null);

  // Load saved style preference from profile
  useEffect(() => {
    const p = loadProfile();
    if (p) {
      setStyle(p.style);
      setOverlayEnabled(p.overlayEnabled);
    }
  }, []);

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
  };

  const handleDownloadPng = useCallback(() => {
    const dataUrl = canvasRef.current?.toDataURL();
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `hng-progress-day${dayNumber}.png`;
    a.click();
  }, [dayNumber]);

  const handleDownloadGif = useCallback(async () => {
    setGifStatus("encoding");
    try {
      // Pre-load images
      const logoImg = await loadImage(HNG_LOGO_SVG);
      const styleConfig = style !== "default" ? STYLE_CONFIG[style] : null;
      const bgImg = styleConfig ? await loadImage(styleConfig.src) : null;
      const photoImg = badgeData.photoDataUrl
        ? await loadImage(badgeData.photoDataUrl)
        : null;

      const gifBlob = await encodeGif({
        width: 540,
        height: 540,
        fps: 15,
        totalFrames: 45,
        drawFrame: (ctx, progress) => {
          drawProgressBadge(ctx, badgeData, photoImg, logoImg, bgImg, progress);
        },
      });

      const url = URL.createObjectURL(gifBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hng-progress-day${dayNumber}.gif`;
      a.click();
      URL.revokeObjectURL(url);
      setGifStatus("idle");
    } catch (err) {
      console.error("GIF encoding failed:", err);
      setGifStatus("error");
      setTimeout(() => setGifStatus("idle"), 3000);
    }
  }, [badgeData, dayNumber, style]);

  const handleDownload = exportMode === "gif" ? handleDownloadGif : handleDownloadPng;

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
            disabled={gifStatus === "encoding"}
            className="w-full py-3 rounded-xl bg-[#00AEFF] hover:bg-[#00c8ff] active:bg-[#0090dd] text-white font-semibold text-sm transition-colors disabled:opacity-60"
          >
            {exportMode === "gif"
              ? gifStatus === "encoding"
                ? "Creating GIF..."
                : gifStatus === "error"
                  ? "Failed — try again"
                  : "Download GIF"
              : "Download Badge"}
          </button>
        </div>

        {/* Share panel */}
        <div className="border-t border-gray-800 pt-4">
          <SharePanel role={profile.role} badgeName={profile.name} canvasRef={canvasRef} />
        </div>
      </div>

      {/* Preview */}
      <div className="flex-1 flex flex-col items-center">
        <div className="w-full max-w-sm lg:max-w-md aspect-square rounded-2xl overflow-hidden shadow-2xl shadow-orange-900/20 border border-gray-800">
          <ProgressBadgeCanvas ref={canvasRef} data={badgeData} />
        </div>

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

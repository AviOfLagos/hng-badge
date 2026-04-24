"use client";

import { useState, useCallback } from "react";
import type { BadgeRole } from "./BadgeCanvas";
import type { BadgeCanvasRef } from "./BadgeCanvas";

// ─── Dynamic captions with week/day ─────────────────────────────────────────

const HNG_START = new Date("2026-04-10T00:00:00").getTime();

function getWeekAndDay() {
  const dayNum = Math.max(1, Math.floor((Date.now() - HNG_START) / 86400000));
  const week = Math.ceil(dayNum / 7);
  return { week, day: dayNum };
}

function getCaption(platform: string, role: BadgeRole): string {
  const { week, day } = getWeekAndDay();

  const captions: Record<string, Record<BadgeRole, string>> = {
    x: {
      intern:
        `🚀 Week ${week} at @hnginternship — Day ${day}!\n\nBuilding real products, shipping real code, levelling up with the best. Let's go!\n\ncc @avioflagos\n\n#HNGInternship #HNGi14 #TechCareer #DevLife`,
      mentor:
        `🎯 Week ${week} mentoring at @hnginternship — Day ${day}!\n\nGuiding the next wave of African tech talent. If you're serious about tech, this is where you level up.\n\ncc @avioflagos\n\n#HNGInternship #HNGi14 #TechMentor`,
    },
    instagram: {
      intern:
        `Week ${week} at @hnginternship — Day ${day} 🚀\n\nBuilding real products. Shipping real code. Growing every day. 💻✨\n\ncc @avioflagos\n\n#HNGInternship #HNGi14 #TechInternship #AfricaTech #DevLife #SoftwareDeveloper #Coding #TechCommunity`,
      mentor:
        `Week ${week} mentoring at @hnginternship — Day ${day} 🎯\n\nHelping the next generation of tech talent grow and ship real products.\n\ncc @avioflagos\n\n#HNGInternship #HNGi14 #TechMentor #AfricaTech #TechCommunity #Leadership`,
    },
  };

  return captions[platform]?.[role] ?? captions.x[role];
}

// ─── Platform config ──────────────────────────────────────────────────────────

interface Platform {
  id: string;
  name: string;
  doneMsg: string;
  icon: React.ReactNode;
  getUrl: (caption: string) => string | null;
  hero?: boolean;
}

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);

const PLATFORMS: Platform[] = [
  {
    id: "x",
    name: "Post on X (Twitter)",
    doneMsg: "X opened — paste your badge (Ctrl+V) & post!",
    icon: <XIcon />,
    hero: true,
    getUrl: (caption) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(caption)}&url=${encodeURIComponent("https://x.com/AviOfLagos/status/2047572738009632940")}`,
  },
  {
    id: "instagram",
    name: "Instagram",
    doneMsg: "Caption copied — open Instagram & paste your badge!",
    icon: <InstagramIcon />,
    getUrl: () => null,
  },
];

// ─── helpers ──────────────────────────────────────────────────────────────────

function downloadBadge(dataUrl: string, name: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = name;
  a.click();
}

// ─── component ────────────────────────────────────────────────────────────────

interface SharePanelProps {
  role: BadgeRole;
  badgeName: string;
  canvasRef: React.RefObject<BadgeCanvasRef | null>;
}

type ShareStatus = "idle" | "loading" | "done" | "error";

export default function SharePanel({ role, badgeName, canvasRef }: SharePanelProps) {
  const [badgeSaved, setBadgeSaved] = useState(false);
  const [copyDone, setCopyDone] = useState(false);
  const [showPasteHint, setShowPasteHint] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, ShareStatus>>({});

  const fileName = `hng-badge-${badgeName || "badge"}.png`;

  const setStatus = (id: string, s: ShareStatus) =>
    setStatuses((prev) => ({ ...prev, [id]: s }));

  // ── Step 1: Save actions ──

  const handleDownload = useCallback(() => {
    const dataUrl = canvasRef.current?.toDataURL();
    if (!dataUrl) return;
    downloadBadge(dataUrl, fileName);
    setBadgeSaved(true);
  }, [canvasRef, fileName]);

  const handleCopy = useCallback(async () => {
    const dataUrl = canvasRef.current?.toDataURL();
    if (!dataUrl) return;
    try {
      const blob = await fetch(dataUrl).then((r) => r.blob());
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setCopyDone(true);
      setBadgeSaved(true);
      setShowPasteHint(true);
      setTimeout(() => setCopyDone(false), 4000);
    } catch {
      downloadBadge(dataUrl, fileName);
      setBadgeSaved(true);
    }
  }, [canvasRef, fileName]);

  // ── Step 2: Share actions ──

  const handleShare = useCallback(
    async (platform: Platform) => {
      const dataUrl = canvasRef.current?.toDataURL();
      if (!dataUrl) return;

      setStatus(platform.id, "loading");
      const caption = getCaption(platform.id, role);

      try {
        // Copy image to clipboard first so they can paste it
        try {
          const blob = await fetch(dataUrl).then((r) => r.blob());
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob }),
          ]);
          setShowPasteHint(true);
        } catch { /* clipboard may not be available */ }

        // Mobile: native share sheet
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile && "share" in navigator) {
          try {
            const blob = await fetch(dataUrl).then((r) => r.blob());
            const file = new File([blob], fileName, { type: "image/png" });
            if (navigator.canShare?.({ files: [file] })) {
              await navigator.share({ files: [file], text: caption });
              setStatus(platform.id, "done");
              setTimeout(() => setStatus(platform.id, "idle"), 3000);
              return;
            }
          } catch { /* fall through */ }
        }

        const targetUrl = platform.getUrl(caption);

        if (targetUrl) {
          window.open(targetUrl, "_blank");
        }

        // Copy caption for platforms with no URL (Instagram)
        if (!targetUrl) {
          await navigator.clipboard.writeText(caption);
        }

        setStatus(platform.id, "done");
        setTimeout(() => setStatus(platform.id, "idle"), 5000);
      } catch {
        setStatus(platform.id, "error");
        setTimeout(() => setStatus(platform.id, "idle"), 3000);
      }
    },
    [role, fileName, canvasRef]
  );

  const activeDoneMsg = PLATFORMS.find(
    (p) => (statuses[p.id] ?? "idle") === "done"
  )?.doneMsg;

  return (
    <div className="space-y-4">
      {/* ── Step 1: Save badge ── */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          1. Save your badge
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-[#00AEFF] text-white text-xs font-semibold transition-colors"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Download
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition-colors ${
              copyDone
                ? "bg-green-900/30 border-green-500/50 text-green-400"
                : "bg-gray-800 hover:bg-gray-700 border-gray-700 hover:border-[#00AEFF] text-white"
            }`}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
              <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
            </svg>
            {copyDone ? "Copied!" : "Copy Image"}
          </button>
        </div>
        {badgeSaved && (
          <p className="text-[11px] text-green-400 mt-1.5">
            {copyDone ? "✓ Copied to clipboard!" : "Badge saved — now share it below!"}
          </p>
        )}
      </div>

      {/* ── Step 2: Share (revealed after saving) ── */}
      <div className={`transition-all duration-300 overflow-hidden ${badgeSaved ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          2. Share on socials
        </p>

        {/* X / Twitter — hero button */}
        {(() => {
          const xPlatform = PLATFORMS.find((p) => p.id === "x")!;
          const xStatus = statuses.x ?? "idle";
          return (
            <button
              type="button"
              onClick={() => handleShare(xPlatform)}
              disabled={xStatus === "loading" || xStatus === "done"}
              className={`w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl border transition-all duration-200 bg-black hover:bg-zinc-900 border-zinc-700 hover:border-white/40 disabled:cursor-default ${
                xStatus === "done" ? "!border-green-500/50" : ""
              }`}
            >
              <span className="text-white"><XIcon /></span>
              <span className="text-white text-sm font-semibold">
                {xStatus === "loading" ? "Opening X..." : xStatus === "done" ? "X opened — paste badge & post!" : "Post on X (Twitter)"}
              </span>
            </button>
          );
        })()}

        {/* Instagram — secondary */}
        {(() => {
          const igPlatform = PLATFORMS.find((p) => p.id === "instagram")!;
          const igStatus = statuses.instagram ?? "idle";
          return (
            <button
              type="button"
              onClick={() => handleShare(igPlatform)}
              disabled={igStatus === "loading" || igStatus === "done"}
              className={`w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200 bg-gray-800/50 hover:bg-gray-800 border-gray-700 hover:border-[#E1306C]/50 disabled:cursor-default text-xs ${
                igStatus === "done" ? "!border-green-500/50" : ""
              }`}
            >
              <span className="text-[#E1306C]"><InstagramIcon /></span>
              <span className="text-gray-300 font-semibold">
                {igStatus === "loading" ? "Copying..." : igStatus === "done" ? "Caption copied!" : "Share on Instagram"}
              </span>
            </button>
          );
        })()}

        {activeDoneMsg && (
          <p className="text-[11px] text-green-400 font-medium mt-2">
            ✓ {activeDoneMsg}
          </p>
        )}

        {/* Retweet incentive */}
        <div className="mt-3 p-2.5 rounded-lg bg-[#00AEFF]/5 border border-[#00AEFF]/15">
          <p className="text-[11px] text-[#00AEFF] leading-relaxed">
            🔄 Tag <span className="font-bold">@hnginternship</span> and <span className="font-bold">@avioflagos</span> — we&apos;ll retweet your badge!
          </p>
        </div>
      </div>

      {/* ── Floating paste hint card ── */}
      {showPasteHint && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4">
          <div className="bg-gray-900 border border-[#00AEFF]/30 rounded-2xl px-5 py-4 shadow-2xl shadow-black/50 max-w-sm w-[90vw] relative">
            <button
              type="button"
              onClick={() => setShowPasteHint(false)}
              className="absolute top-2.5 right-2.5 text-gray-500 hover:text-white transition-colors p-1"
              aria-label="Close"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <div className="flex items-start gap-3">
              <div className="text-2xl shrink-0">📋</div>
              <div>
                <p className="text-white text-sm font-semibold mb-1">Badge copied to clipboard!</p>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Press <kbd className="bg-gray-800 text-white px-1.5 py-0.5 rounded text-[11px] font-mono font-bold border border-gray-700">Ctrl+V</kbd> (or <kbd className="bg-gray-800 text-white px-1.5 py-0.5 rounded text-[11px] font-mono font-bold border border-gray-700">⌘V</kbd>) to paste your badge into a tweet, post, or anywhere you want.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

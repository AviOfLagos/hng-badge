"use client";

import { useState, useCallback } from "react";
import type { BadgeRole } from "./BadgeCanvas";
import type { BadgeCanvasRef } from "./BadgeCanvas";

// ─── Captions per platform per role ──────────────────────────────────────────

const CAPTIONS: Record<string, Record<BadgeRole, string>> = {
  x: {
    intern:
      "🚀 Just started my tech journey at @HNGInternship!\n\nBuilding real products, shipping real code, levelling up with the best. Let's go!\n\n#HNGInternship #TechCareer #DevLife",
    mentor:
      "Honoured to be mentoring the next wave of African tech talent at @HNGInternship 🎯\n\nIf you're serious about tech, this is where you level up. hng.tech\n\n#HNGInternship #TechMentor",
  },
  whatsapp: {
    intern:
      "Hey! 🙌 I just joined HNG Internship — one of Africa's biggest tech programs!\n\nSuper excited to build real products and level up my skills 💪\n\nCheck it out 👉 hng.tech",
    mentor:
      "Excited to share that I'm mentoring at HNG Internship! 🎯\n\nHelping the next wave of African tech talent grow. It's going to be great!\n\n👉 hng.tech",
  },
  instagram: {
    intern:
      "New chapter unlocked 🔓🚀\n\nSo excited to announce I'm officially interning at HNG — one of Africa's most competitive tech internship programs!\n\nBuilding real products. Growing every day. 💻✨\n\n#HNGInternship #TechInternship #AfricaTech #DevLife #SoftwareDeveloper #Coding #TechCommunity #Innovation",
    mentor:
      "Giving back to the community I love 🤝✨\n\nProud to be mentoring the next generation of tech talent at HNG Internship — one of Africa's most respected tech programs!\n\n#HNGInternship #TechMentor #AfricaTech #GivingBack #TechCommunity #Leadership",
  },
  snapchat: {
    intern: "Just joined HNG Internship! 🔥 Come check it out 👉 hng.tech",
    mentor: "Mentoring the next gen of tech talent at HNG! 🎯 hng.tech",
  },
};

// ─── Platform config ──────────────────────────────────────────────────────────

interface Platform {
  id: string;
  name: string;
  doneMsg: string;
  color: string;
  hoverColor: string;
  borderColor: string;
  icon: React.ReactNode;
  getUrl: (caption: string) => string | null;
}

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);

const SnapchatIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M12.166 0c.32 0 3.278.094 4.838 3.105.533 1.033.404 2.808.3 4.155l-.017.218c-.012.132.088.22.18.26.152.065.387.13.695.13.27 0 .555-.053.845-.159.16-.058.31-.088.443-.088.31 0 .71.154.737.581.024.394-.258.688-.618.87-.047.024-.108.053-.18.083-.28.12-.73.313-.816.686-.046.197.037.42.248.663 1.136 1.326 1.366 2.67 1.378 2.78.042.35-.176.63-.504.713-.39.098-.88.1-1.383.102-1.1.004-2.32.01-3.195 1.213-.272.375-.376.76-.476 1.13-.14.52-.272 1.01-.774 1.011H14.3c-.38 0-.607-.19-.822-.37-.316-.267-.672-.569-1.51-.569-.84 0-1.193.302-1.507.57-.215.181-.442.37-.823.37h-.073c-.502 0-.635-.492-.775-1.01-.1-.371-.204-.756-.476-1.13C7.44 13.35 6.22 13.344 5.12 13.34c-.503-.002-.993-.004-1.382-.102-.33-.082-.547-.363-.505-.714.012-.11.242-1.454 1.378-2.78.21-.243.294-.465.248-.663-.086-.373-.536-.566-.815-.685-.073-.03-.134-.059-.181-.083-.36-.182-.642-.476-.618-.87.028-.427.428-.581.737-.581.133 0 .284.03.443.088.29.106.575.16.845.16.308 0 .543-.066.695-.131.092-.04.19-.128.18-.26l-.017-.218c-.104-1.347-.233-3.122.3-4.155C8.556.094 11.513 0 11.834 0h.332z" />
  </svg>
);

const PLATFORMS: Platform[] = [
  {
    id: "x",
    name: "X (Twitter)",
    doneMsg: "X opened — attach badge & post!",
    color: "bg-black",
    hoverColor: "hover:bg-zinc-900",
    borderColor: "border-zinc-700 hover:border-zinc-400",
    icon: <XIcon />,
    getUrl: (caption) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(caption)}`,
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    doneMsg: "WhatsApp opened — attach badge & send!",
    color: "bg-[#1a1a1a]",
    hoverColor: "hover:bg-[#0d2b1a]",
    borderColor: "border-zinc-700 hover:border-[#25D366]",
    icon: <WhatsAppIcon />,
    getUrl: (caption) =>
      `https://wa.me/?text=${encodeURIComponent(caption)}`,
  },
  {
    id: "instagram",
    name: "Instagram",
    doneMsg: "Caption copied — open Instagram & post!",
    color: "bg-[#1a1a1a]",
    hoverColor: "hover:bg-[#1a0d1a]",
    borderColor: "border-zinc-700 hover:border-[#E1306C]",
    icon: <InstagramIcon />,
    getUrl: () => null,
  },
  {
    id: "snapchat",
    name: "Snapchat",
    doneMsg: "Caption copied — open Snapchat & post!",
    color: "bg-[#1a1a1a]",
    hoverColor: "hover:bg-[#1a1a00]",
    borderColor: "border-zinc-700 hover:border-[#FFFC00]",
    icon: <SnapchatIcon />,
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
      setTimeout(() => setCopyDone(false), 2000);
    } catch {
      // Clipboard API not supported — fall back to download
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
      const caption = CAPTIONS[platform.id][role];

      try {
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

        // Open platform URL synchronously before any await
        if (targetUrl) {
          window.open(targetUrl, "_blank");
        }

        // Copy caption for platforms with no URL (Instagram, Snapchat)
        if (!targetUrl) {
          await navigator.clipboard.writeText(caption);
        }

        setStatus(platform.id, "done");
        setTimeout(() => setStatus(platform.id, "idle"), 3500);
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
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-[#00AEFF] text-white text-xs font-semibold transition-colors"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Download
          </button>
          <button
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
            Badge saved — now share it below!
          </p>
        )}
      </div>

      {/* ── Step 2: Share (revealed after saving) ── */}
      <div className={`transition-all duration-300 overflow-hidden ${badgeSaved ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          2. Share on socials
        </p>
        <div className="grid grid-cols-2 gap-2">
          {PLATFORMS.map((platform) => {
            const status = statuses[platform.id] ?? "idle";
            return (
              <button
                key={platform.id}
                onClick={() => handleShare(platform)}
                disabled={status === "loading" || status === "done"}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-xl
                  border transition-all duration-200
                  ${platform.color} ${platform.hoverColor} ${platform.borderColor}
                  disabled:cursor-default
                  ${status === "done" ? "!border-green-500/50 opacity-70" : ""}
                `}
              >
                <span className={`flex-shrink-0 ${
                  platform.id === "x" ? "text-white" :
                  platform.id === "whatsapp" ? "text-[#25D366]" :
                  platform.id === "instagram" ? "text-[#E1306C]" :
                  "text-[#FFFC00]"
                }`}>
                  {platform.icon}
                </span>
                <span className="text-white text-xs font-semibold leading-tight truncate">
                  {status === "loading" ? "Opening…" : status === "done" ? "Done!" : platform.name}
                </span>
              </button>
            );
          })}
        </div>

        {activeDoneMsg && (
          <p className="text-[11px] text-green-400 font-medium mt-2">
            ✓ {activeDoneMsg}
          </p>
        )}
      </div>
    </div>
  );
}

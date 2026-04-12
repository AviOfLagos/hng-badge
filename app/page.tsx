"use client";

import { useState, useRef, useCallback, ChangeEvent } from "react";
import dynamic from "next/dynamic";
import type { BadgeCanvasRef, BadgeData, BadgeRole } from "@/components/BadgeCanvas";
import SharePanel from "@/components/SharePanel";

const BadgeCanvas = dynamic(() => import("@/components/BadgeCanvas"), { ssr: false });

const HNG_TRACKS = [
  "Frontend",
  "Backend",
  "Mobile",
  "UI/UX Design",
  "DevOps",
  "Data Science",
  "Product Management",
  "Cybersecurity",
  "Marketing",
  "Other",
];


export default function Home() {
  const [name, setName] = useState("");
  const [role, setRole] = useState<BadgeRole>("intern");
  const [track, setTrack] = useState("");
  const [customTrack, setCustomTrack] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const canvasRef = useRef<BadgeCanvasRef>(null);

  const badgeData: BadgeData = {
    name,
    role,
    track: track === "Other" ? customTrack : track,
    photoDataUrl,
  };

  const handlePhoto = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoDataUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDownload = useCallback(() => {
    const dataUrl = canvasRef.current?.toDataURL();
    if (!dataUrl) return;
    setDownloading(true);
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `hng-badge-${name || "badge"}.png`;
    a.click();
    setTimeout(() => setDownloading(false), 1000);
  }, [name]);


  return (
    <main className="min-h-screen flex flex-col items-center py-10 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <span className="text-orange-500 font-bold text-2xl tracking-tight">HNG</span>
        <span className="text-white font-light text-2xl"> Badge Generator</span>
        <p className="text-gray-400 text-sm mt-1">Create your badge and share it on socials</p>
      </div>

      <div className="w-full max-w-4xl flex flex-col lg:flex-row gap-8 items-start justify-center">
        {/* Form */}
        <div className="w-full lg:w-80 flex-shrink-0 bg-gray-900 rounded-2xl p-6 space-y-5 border border-gray-800">
          {/* Role toggle */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              I am a...
            </label>
            <div className="flex rounded-xl overflow-hidden border border-gray-700">
              {(["intern", "mentor"] as BadgeRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`flex-1 py-2.5 text-sm font-semibold capitalize transition-colors ${
                    role === r
                      ? "bg-[#00AEFF] text-white"
                      : "bg-gray-800 text-gray-400 hover:text-white"
                  }`}
                >
                  {r === "intern" ? "Intern" : "Mentor"}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Johnson"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#00AEFF] transition-colors text-sm"
            />
          </div>

          {/* Track */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Track
            </label>
            <select
              value={track}
              onChange={(e) => setTrack(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#00AEFF] transition-colors text-sm appearance-none"
            >
              <option value="">Select your track</option>
              {HNG_TRACKS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            {track === "Other" && (
              <input
                type="text"
                value={customTrack}
                onChange={(e) => setCustomTrack(e.target.value)}
                placeholder="Enter your track"
                className="mt-2 w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#00AEFF] transition-colors text-sm"
              />
            )}
          </div>

          {/* Photo upload */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Your Photo
            </label>
            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-700 rounded-xl cursor-pointer hover:border-[#00AEFF] transition-colors bg-gray-800/50">
              {photoDataUrl ? (
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <span>✓</span>
                  <span>Photo uploaded</span>
                  <span
                    className="text-gray-500 hover:text-white ml-1 cursor-pointer"
                    onClick={(e) => { e.preventDefault(); setPhotoDataUrl(null); }}
                  >
                    ✕
                  </span>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-2xl mb-1">📸</div>
                  <div className="text-sm text-gray-400">Click to upload photo</div>
                  <div className="text-xs text-gray-600 mt-1">JPG, PNG, WEBP</div>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhoto}
              />
            </label>
          </div>

          {/* Download */}
          <div className="pt-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full py-3 rounded-xl bg-[#00AEFF] hover:bg-[#00c8ff] active:bg-[#0090dd] text-white font-semibold text-sm transition-colors disabled:opacity-60"
            >
              {downloading ? "Downloading…" : "⬇ Download Badge"}
            </button>
          </div>

          {/* Share panel */}
          <div className="border-t border-gray-800 pt-4">
            <SharePanel role={role} badgeName={name} canvasRef={canvasRef} />
          </div>
        </div>

        {/* Badge Preview */}
        <div className="flex-1 flex flex-col items-center">
          <div className="w-full max-w-sm lg:max-w-md aspect-square rounded-2xl overflow-hidden shadow-2xl shadow-orange-900/20 border border-gray-800">
            <BadgeCanvas ref={canvasRef} data={badgeData} />
          </div>
          <p className="text-gray-600 text-xs mt-3">Live preview — updates as you type</p>
        </div>
      </div>
    </main>
  );
}

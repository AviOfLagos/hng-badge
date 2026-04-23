# Progress Badge + GIF Export Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a tabbed Progress Badge creator with "Day XX at HNG" counter and animated GIF export, without touching the existing badge creator.

**Architecture:** Extract shared canvas helpers to `lib/badge-helpers.ts`, add localStorage persistence via `lib/storage.ts`, build a new `ProgressBadgeCanvas` with Update-First layout, wrap existing + new badge creators in a tab system, and add client-side GIF encoding via `modern-gif`.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind 4, HTML Canvas, modern-gif (WASM)

**Spec:** `docs/superpowers/specs/2026-04-23-progress-badge-and-gif-design.md`

---

## Chunk 1: Foundation (shared helpers + storage + dependency)

### Task 1: Install modern-gif dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install modern-gif**

```bash
npm install modern-gif
```

- [ ] **Step 2: Verify it installed**

```bash
npx next build
```

Expected: Build passes, no errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add modern-gif dependency for animated badge export"
```

---

### Task 2: Extract shared canvas helpers

**Files:**
- Create: `lib/badge-helpers.ts`
- Modify: `components/BadgeCanvas.tsx`

- [ ] **Step 1: Create `lib/badge-helpers.ts`**

Move these from `BadgeCanvas.tsx`:
- `S` constant (1080)
- `STYLE_CONFIG` record
- `HNG_LOGO_SVG` data URI string
- `drawRoundedRect()` function
- `drawCornerBrackets()` function
- `drawDotGrid()` function
- `wrapText()` function

All exports should be named exports. No default export.

```typescript
// lib/badge-helpers.ts
export const S = 1080;

export const STYLE_CONFIG: Record<string, { src: string; overlay: number }> = {
  bg1: { src: "/bg/HNG-BG-01.jpg", overlay: 0.62 },
  bg2: { src: "/bg/HNG-BG-02.jpg", overlay: 0.42 },
  bg3: { src: "/bg/HNG-BG-03.jpg", overlay: 0.52 },
  bg4: { src: "/bg/HNG-BG-04.jpg", overlay: 0.42 },
  bg5: { src: "/bg/HNG-BG-05.jpg", overlay: 0.52 },
  bg6: { src: "/bg/HNG-BG-06.jpg", overlay: 0.42 },
};

export const HNG_LOGO_SVG = `data:image/svg+xml,${encodeURIComponent(`<svg ...>`)}`;
// (copy exact SVG string from BadgeCanvas.tsx)

export function drawRoundedRect(...) { /* copy exact implementation */ }
export function drawCornerBrackets(...) { /* copy exact implementation */ }
export function drawDotGrid(...) { /* copy exact implementation — note: uses S */ }
export function wrapText(...) { /* copy exact implementation */ }
```

- [ ] **Step 2: Update `BadgeCanvas.tsx` to import from shared helpers**

Replace the inline definitions with imports:
```typescript
import { S, STYLE_CONFIG, HNG_LOGO_SVG, drawRoundedRect, drawCornerBrackets, drawDotGrid, wrapText } from "@/lib/badge-helpers";
```

Remove the inline definitions of all 7 items. Keep everything else (types, `drawBadge`, component) unchanged.

- [ ] **Step 3: Verify build passes and badge still works**

```bash
npx next build
```

Expected: Build passes. Existing badge renders identically (visual check via `npm run dev`).

- [ ] **Step 4: Commit**

```bash
git add lib/badge-helpers.ts components/BadgeCanvas.tsx
git commit -m "refactor: extract shared canvas helpers to lib/badge-helpers"
```

---

### Task 3: Create localStorage persistence module

**Files:**
- Create: `lib/storage.ts`

- [ ] **Step 1: Create `lib/storage.ts`**

```typescript
import type { BadgeRole, BadgeStyle } from "@/components/BadgeCanvas";

export interface SavedProfile {
  name: string;
  role: BadgeRole;
  track: string;
  photoDataUrl: string | null;
  style: BadgeStyle;
  overlayEnabled: boolean;
}

const PROFILE_KEY = "hng-badge-profile";

export function saveProfile(profile: SavedProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export function loadProfile(): SavedProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedProfile;
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: Verify build**

```bash
npx next build
```

- [ ] **Step 3: Commit**

```bash
git add lib/storage.ts
git commit -m "feat: add localStorage persistence for badge profile"
```

---

## Chunk 2: Day Counter + Tab System in page.tsx

### Task 4: Create DayCounter component

**Files:**
- Create: `components/DayCounter.tsx`

- [ ] **Step 1: Create `components/DayCounter.tsx`**

```typescript
"use client";

import { useState, useEffect } from "react";

const HNG_START = new Date("2026-04-10T00:00:00").getTime();

function getElapsed() {
  const now = Date.now();
  const diffMs = Math.max(0, now - HNG_START);
  const totalSec = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const min = Math.floor((totalSec % 3600) / 60);
  const sec = totalSec % 60;
  return { days, hours, min, sec };
}

function Card({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 min-w-[56px] text-center">
      <div className="text-white text-2xl font-bold leading-none">
        {String(value).padStart(2, "0")}
      </div>
      <div className="text-gray-500 text-[10px] uppercase tracking-widest mt-1">
        {label}
      </div>
    </div>
  );
}

export default function DayCounter() {
  const [elapsed, setElapsed] = useState(getElapsed);

  useEffect(() => {
    const id = setInterval(() => setElapsed(getElapsed()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-2xl px-6 py-4 text-center">
      <div className="text-gray-400 text-xs uppercase tracking-[3px] mb-3">
        Day {elapsed.days} at HNG
      </div>
      <div className="flex gap-3 justify-center">
        <Card value={elapsed.days} label="Days" />
        <Card value={elapsed.hours} label="Hours" />
        <Card value={elapsed.min} label="Min" />
        <Card value={elapsed.sec} label="Sec" />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npx next build
```

- [ ] **Step 3: Commit**

```bash
git add components/DayCounter.tsx
git commit -m "feat: add DayCounter component showing Day XX at HNG"
```

---

### Task 5: Add tab system + localStorage save to page.tsx

**Files:**
- Modify: `app/page.tsx`

This is the most sensitive task — the existing badge UI must remain **identical**. Changes:

1. Add `activeTab` state
2. Add `useEffect` to save profile to localStorage on field changes
3. Wrap existing badge UI in `{activeTab === "badge" && (...)}`
4. Add DayCounter between header and content
5. Add tab bar between DayCounter and content
6. Add placeholder for progress tab (next task fills it in)

- [ ] **Step 1: Add imports at top of page.tsx**

Add these imports:
```typescript
import { useEffect } from "react"; // add to existing import
import { saveProfile } from "@/lib/storage";
import DayCounter from "@/components/DayCounter";
```

Note: `DayCounter` uses `setInterval` so wrap it with `dynamic(..., { ssr: false })` like BadgeCanvas.

- [ ] **Step 2: Add state and localStorage effect**

After the existing state declarations, add:
```typescript
const [activeTab, setActiveTab] = useState<"badge" | "progress">("badge");
```

After `canvasRef`, add the save effect:
```typescript
useEffect(() => {
  saveProfile({
    name,
    role,
    track: track === "Other" ? customTrack : track,
    photoDataUrl,
    style,
    overlayEnabled,
  });
}, [name, role, track, customTrack, photoDataUrl, style, overlayEnabled]);
```

- [ ] **Step 3: Add DayCounter and tab bar after header**

After the header `<div>` and before the content `<div>`, insert:
```tsx
{/* Day Counter */}
<div className="w-full max-w-4xl mb-6">
  <DayCounter />
</div>

{/* Tab Bar */}
<div className="w-full max-w-4xl flex mb-6">
  <button
    type="button"
    onClick={() => setActiveTab("badge")}
    className={`flex-1 py-3 text-sm font-semibold rounded-l-xl border transition-colors ${
      activeTab === "badge"
        ? "bg-[#00AEFF] text-white border-[#00AEFF]"
        : "bg-gray-800 text-gray-400 border-gray-700 hover:text-white"
    }`}
  >
    HNG Badge
  </button>
  <button
    type="button"
    onClick={() => setActiveTab("progress")}
    className={`flex-1 py-3 text-sm font-semibold rounded-r-xl border border-l-0 transition-colors ${
      activeTab === "progress"
        ? "bg-[#00AEFF] text-white border-[#00AEFF]"
        : "bg-gray-800 text-gray-400 border-gray-700 hover:text-white"
    }`}
  >
    Progress Badge
  </button>
</div>
```

- [ ] **Step 4: Wrap existing badge content in tab conditional**

Wrap the entire `<div className="w-full max-w-4xl flex flex-col lg:flex-row ...">` block with:
```tsx
{activeTab === "badge" && (
  <div className="w-full max-w-4xl flex flex-col lg:flex-row gap-8 items-start justify-center">
    {/* ... all existing badge content unchanged ... */}
  </div>
)}

{activeTab === "progress" && (
  <div className="w-full max-w-4xl text-center text-gray-500 py-20">
    Progress Badge — coming next...
  </div>
)}
```

- [ ] **Step 5: Build and visual check**

```bash
npx next build && npm run dev
```

Expected: Build passes. Both tabs work. Badge tab shows exact same UI. Progress tab shows placeholder. Day counter ticks. Switching tabs preserves badge state.

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add tab system, day counter, and localStorage profile save"
```

---

## Chunk 3: Progress Badge Canvas + Tab

### Task 6: Create ProgressBadgeCanvas component

**Files:**
- Create: `components/ProgressBadgeCanvas.tsx`

- [ ] **Step 1: Create the canvas component**

Implements the Update-First layout (Option C from design):
- Top bar: HNG logo (left, smaller ~160px wide) + "DAY XX" pill (right)
- Hero text: update text, bold, left-aligned, progressive font scaling
- Bottom byline bar: separator line, then photo circle + name + role left, track pill right
- Background: same system as main badge (STYLE_CONFIG + overlay)
- Corner brackets + outer border from shared helpers

Key details:
- `forwardRef` with `BadgeCanvasRef` (same as BadgeCanvas)
- Import all rendering helpers from `@/lib/badge-helpers`
- `ProgressBadgeData` interface defined in this file
- Hero text font starts at `S * 0.055` and reduces to min `S * 0.030` if more than 5 lines
- Photo in byline is small (radius ~40px), not the large centered circle from main badge

```typescript
"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import type { BadgeRole, BadgeStyle, BadgeCanvasRef } from "@/components/BadgeCanvas";
import {
  S, STYLE_CONFIG, HNG_LOGO_SVG,
  drawRoundedRect, drawCornerBrackets, drawDotGrid, wrapText,
} from "@/lib/badge-helpers";

export interface ProgressBadgeData {
  updateText: string;
  dayNumber: number;
  name: string;
  role: BadgeRole;
  track: string;
  photoDataUrl: string | null;
  style: BadgeStyle;
  overlayEnabled: boolean;
}
```

The `drawProgressBadge()` function should:
1. Draw background (same logic as main badge — bg image + overlay or default gradient)
2. Draw outer border + corner brackets
3. Draw logo (left, ~160px wide) at top-left area (x=80, y=70)
4. Draw "DAY XX" pill at top-right (cyan bg, white text)
5. Draw hero text starting at y~240, left-aligned at x=80, max width S-160
6. Draw separator line above byline
7. Draw byline at bottom: small photo circle (r=40) + name + role text on left, track pill on right
8. Draw "hng.tech" watermark at bottom center

- [ ] **Step 2: Verify build**

```bash
npx next build
```

- [ ] **Step 3: Commit**

```bash
git add components/ProgressBadgeCanvas.tsx
git commit -m "feat: add ProgressBadgeCanvas with Update-First layout"
```

---

### Task 7: Create ProgressBadgeTab component

**Files:**
- Create: `components/ProgressBadgeTab.tsx`

- [ ] **Step 1: Create the tab component**

Layout mirrors the main badge tab: left form panel + right preview.

Left panel:
- Profile summary from localStorage (or "Create your HNG Badge first" prompt)
- `<textarea>` for update text (max 280 chars, character counter)
- GIF / Picture segmented toggle
- Download button (PNG or GIF depending on toggle)
- SharePanel (reused, receives canvasRef)

Right panel:
- ProgressBadgeCanvas preview
- Background selector (same thumbnails as main badge)
- Overlay toggle

State:
- `updateText: string`
- `exportMode: "picture" | "gif"`
- `style: BadgeStyle` (default from saved profile or "default")
- `overlayEnabled: boolean` (default from saved profile or true)
- `gifStatus: "idle" | "encoding" | "done" | "error"`

Reads profile from `loadProfile()` on mount. If null, shows the prompt instead of the form.

For GIF download: import and call `encodeGif()` from `lib/gif-encoder.ts` (Task 8). For now, wire up the PNG download and leave a TODO comment for GIF encoding that Task 8 will fill in.

```typescript
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import type { BadgeCanvasRef, BadgeStyle } from "@/components/BadgeCanvas";
import type { ProgressBadgeData } from "@/components/ProgressBadgeCanvas";
import { loadProfile } from "@/lib/storage";
import SharePanel from "@/components/SharePanel";

const ProgressBadgeCanvas = dynamic(
  () => import("@/components/ProgressBadgeCanvas"),
  { ssr: false }
);
```

Day number calculation: `Math.max(0, Math.floor((Date.now() - new Date("2026-04-10").getTime()) / 86400000))`

- [ ] **Step 2: Wire it into page.tsx**

Replace the progress tab placeholder in `page.tsx`:
```typescript
import ProgressBadgeTab from "@/components/ProgressBadgeTab";

// In the render, replace the placeholder:
{activeTab === "progress" && <ProgressBadgeTab />}
```

- [ ] **Step 3: Build and visual check**

```bash
npx next build && npm run dev
```

Expected: Progress tab shows form + canvas preview. Update text renders on canvas. Background selector works. PNG download works. Profile data pulled from localStorage.

- [ ] **Step 4: Commit**

```bash
git add components/ProgressBadgeTab.tsx app/page.tsx
git commit -m "feat: add ProgressBadgeTab with form, preview, and PNG download"
```

---

## Chunk 4: GIF Encoding

### Task 8: Create GIF encoder and wire it up

**Files:**
- Create: `lib/gif-encoder.ts`
- Modify: `components/ProgressBadgeTab.tsx`

- [ ] **Step 1: Create `lib/gif-encoder.ts`**

```typescript
import { encode } from "modern-gif";

interface GifOptions {
  width: number;
  height: number;
  fps: number;
  totalFrames: number;
  drawFrame: (ctx: CanvasRenderingContext2D, progress: number) => void;
}

export async function encodeGif(options: GifOptions): Promise<Blob> {
  const { width, height, fps, totalFrames, drawFrame } = options;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const delay = Math.round(1000 / fps);

  const frames: { data: ImageData; delay: number }[] = [];
  for (let i = 0; i < totalFrames; i++) {
    const progress = i / (totalFrames - 1);
    drawFrame(ctx, progress);
    const imageData = ctx.getImageData(0, 0, width, height);
    frames.push({ data: imageData, delay });
  }

  const output = await encode({
    width,
    height,
    frames: frames.map((f) => ({
      data: f.data.data,
      delay: f.delay,
    })),
  });

  return new Blob([output], { type: "image/gif" });
}
```

Note: Check `modern-gif` API at build time. The `encode` function may need `frames` as `{ imageData, delay }[]` — adapt to actual API shape. The key pattern is: render frames to offscreen canvas → collect ImageData → pass to encoder.

- [ ] **Step 2: Add animated draw function to ProgressBadgeCanvas**

Export a `drawProgressBadgeAnimated()` function from `ProgressBadgeCanvas.tsx` that accepts `(ctx, data, progress, logoImg, photoImg, bgImg)` and renders partial content based on `progress` (0→1):

- `progress 0–0.18`: background + border + brackets fade in (alpha = progress / 0.18)
- `progress 0.18–0.33`: logo + DAY pill fade in
- `progress 0.33–0.62`: hero text types on (show first N characters)
- `progress 0.62–0.84`: byline slides up from bottom
- `progress 0.84–1.0`: hold final frame

- [ ] **Step 3: Wire GIF download into ProgressBadgeTab**

In the download handler, when `exportMode === "gif"`:
1. Set `gifStatus` to `"encoding"`
2. Pre-load logo, photo, bg images
3. Call `encodeGif()` with `width: 540, height: 540, fps: 15, totalFrames: 45` and a `drawFrame` callback that calls `drawProgressBadgeAnimated()` (scale ctx by 540/1080)
4. On success: create blob URL, trigger download, set `gifStatus` to `"idle"`
5. On error: set `gifStatus` to `"error"`, log error, auto-reset after 3s

Download button label:
- Picture mode: "Download Badge"
- GIF idle: "Download GIF"
- GIF encoding: "Creating GIF..."
- GIF error: "Failed — try again"

- [ ] **Step 4: Build and test**

```bash
npx next build && npm run dev
```

Test: Switch to progress tab, type an update, toggle to GIF mode, click download. A .gif file should download with the animation.

- [ ] **Step 5: Commit**

```bash
git add lib/gif-encoder.ts components/ProgressBadgeCanvas.tsx components/ProgressBadgeTab.tsx
git commit -m "feat: add animated GIF export for progress badge"
```

---

## Chunk 5: Final integration + push

### Task 9: Final build + push to prod

- [ ] **Step 1: Full build verification**

```bash
npx next build
```

Expected: Clean build, no errors, no warnings.

- [ ] **Step 2: Visual smoke test**

```bash
npm run dev
```

Check:
1. Badge tab: all existing functionality works identically
2. Progress tab: form loads profile from localStorage
3. Progress tab: canvas renders Update-First layout correctly
4. Progress tab: PNG download works
5. Progress tab: GIF download produces animated file
6. Day counter ticks correctly
7. Tab switching preserves state
8. Background selector + overlay toggle work on both tabs

- [ ] **Step 3: Commit any final fixes**

- [ ] **Step 4: Push to prod**

```bash
git push origin main
```

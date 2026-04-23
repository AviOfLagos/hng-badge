# Progress Badge + GIF Export — Design Spec

## Overview

Add a "Progress Badge" tab alongside the existing HNG Badge creator. Users share weekly updates as shareable badge images. GIF export available on the new tab. A persistent "Day XX at HNG" counter sits above both tabs. Existing badge creator remains untouched.

## Architecture

### Page Layout (top to bottom)

1. **Header** — "HNG Badge Generator" (existing, unchanged)
2. **Day Counter** — flip-card style showing "Day XX at HNG" (always visible, calculated from April 10 2026)
3. **Tab Bar** — "HNG Badge" | "Progress Badge"
4. **Tab Content** — either the existing badge creator OR the new progress badge creator

### Tab System

- Two tabs rendered via state toggle (`activeTab: "badge" | "progress"`)
- "HNG Badge" tab renders the current `page.tsx` content exactly as-is (no changes)
- "Progress Badge" tab renders a new form + preview layout

### Day Counter Component

New component: `components/DayCounter.tsx`

- Flip-card style: 4 cards for Days, Hours, Min, Sec (days is the hero — hours/min/sec show time elapsed today)
- Calculated: `Math.max(0, Math.floor((now - April 10 2026) / 86400000))`
- If before April 10 2026, shows "Day 0" (no negative values)
- Live ticking via `setInterval` (1s)
- Styled with the same dark theme (bg-gray-900 cards, cyan accents)

### localStorage Persistence

Key: `hng-badge-profile`

```typescript
interface SavedProfile {
  name: string;
  role: BadgeRole;
  track: string;        // Always the resolved value (customTrack when track === "Other")
  photoDataUrl: string | null;
  style: BadgeStyle;
  overlayEnabled: boolean;
}
```

Note: `SavedProfile` is intentionally a separate type from `BadgeData` — it stores the **resolved** track value (not the raw select + customTrack pair), making it a serialization format rather than a UI state mirror. Types imported from `BadgeCanvas.tsx` (`BadgeRole`, `BadgeStyle`).

- **Saved by:** the existing badge tab, on every field change (add `useEffect` that writes to localStorage). The save logic resolves `track === "Other" ? customTrack : track` before persisting.
- **Read by:** the progress badge tab, to populate name/photo/track/role
- Profile fields are not editable on the progress tab — user goes to the HNG Badge tab to update them

### Shared Rendering Utilities

New file: `lib/badge-helpers.ts`

Extract these from `BadgeCanvas.tsx` into a shared module:
- `STYLE_CONFIG` — background image paths and overlay opacities
- `HNG_LOGO_SVG` — logo data URI
- `drawRoundedRect()` — rounded rectangle path helper
- `drawCornerBrackets()` — L-shaped corner bracket renderer
- `drawDotGrid()` — subtle dot grid texture
- `wrapText()` — text wrapping utility
- `S` constant (1080)

`BadgeCanvas.tsx` is modified **only** to import these from the shared module instead of defining them inline. No rendering logic, component structure, or behavior changes. The refactor is mechanical (move definitions → re-import). Both `BadgeCanvas.tsx` and `ProgressBadgeCanvas.tsx` import from this shared module.

### Progress Badge Tab

**Left panel (form):**
- Read-only profile summary (name + photo thumbnail + track) pulled from localStorage
  - If no profile saved, show prompt: "Create your HNG Badge first to set up your profile"
- "What I'm working on" — `<textarea>` for free-text update (max 280 characters, with character counter)
- GIF / Picture toggle (segmented control)
- Download button (behavior changes based on GIF/Picture toggle — see GIF Export section)
- Share panel (reuses existing `SharePanel` component)

**Right panel (preview):**
- Live canvas preview of the progress badge
- Background selector + overlay toggle below (same pattern as main badge)

### Progress Badge Canvas

New component: `components/ProgressBadgeCanvas.tsx`

- Exposes `BadgeCanvasRef` via `forwardRef` (same contract as `BadgeCanvas.tsx`: `{ toDataURL: () => string }`) so `SharePanel` works without modification
- Canvas size: 1080x1080 (same as main badge)

Layout (Update-First / Option C):
- **Top bar:** HNG logo (left) + "DAY XX" label (right, cyan)
- **Hero text:** user's update text, bold, large, left-aligned — this is the star
- **Text overflow:** uses `wrapText()` from shared helpers. If text exceeds ~5 lines, font size reduces progressively (min 32px). Text is never truncated — it always renders fully.
- **Bottom byline:** horizontal bar with photo circle + name + role, track pill on right
- **Background:** uses `STYLE_CONFIG` + overlay system from shared helpers
- Corner brackets + outer border from shared helpers

```typescript
interface ProgressBadgeData {
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

### GIF Export

**Library:** `modern-gif` (maintained, ESM-native, TypeScript types, WASM-based encoder, works with Next.js bundling out of the box)

**Toggle:** segmented control on the progress tab — "Picture" | "GIF"

**When "Picture":** download as PNG via `canvas.toDataURL()` (immediate)

**When "GIF":** async encoding pipeline, download button shows progress state

**Download button states for GIF mode:**
- Idle: "Download GIF"
- Encoding: "Creating GIF..." (disabled, spinner)
- Done: triggers browser download, resets to idle
- Error: "Failed — try again" (auto-resets after 3s)

**Sharing in GIF mode:** `SharePanel` always shares a static PNG screenshot (via `canvasRef.toDataURL()`), regardless of the GIF/Picture toggle. The GIF is only for the download action. This avoids needing to modify `SharePanel` at all.

**Animation sequence (top-down reveal, ~3 seconds, 15fps = ~45 frames):**
1. Frames 1–8: Background draws in, border + brackets fade in
2. Frames 9–15: Logo + "DAY XX" fade in
3. Frames 16–28: Update text types on (character by character)
4. Frames 29–38: Byline (photo + name + track) slides up from bottom
5. Frames 39–45: Hold final frame

**Loop:** infinite (GIF loops forever)

**Performance:** Render at 540x540 (half resolution) to keep memory usage reasonable (~45 frames × 540² × 4 bytes ≈ 53MB). The output GIF is still high quality at social media sizes. Encoding runs in a web worker via `modern-gif` so the UI stays responsive.

**Error handling:** If encoding fails (memory, worker error), catch the promise rejection, show error state on the download button, log to console. No retry loop.

**Implementation:**
- `lib/gif-encoder.ts`: wrapper around `modern-gif` that accepts a `drawFrame(ctx, progress)` callback
- `generateGifFrames()` calls `drawProgressBadge()` repeatedly with a `progress` parameter (0→1)
- Each draw call renders only the elements visible at that progress point
- Returns a Blob URL for download

## Files to Create

| File | Purpose |
|------|---------|
| `lib/badge-helpers.ts` | Shared rendering utilities extracted from BadgeCanvas |
| `lib/storage.ts` | localStorage read/write helpers for SavedProfile |
| `lib/gif-encoder.ts` | modern-gif wrapper for animation export |
| `components/DayCounter.tsx` | Flip-card day counter |
| `components/ProgressBadgeCanvas.tsx` | Canvas renderer for progress badge (exposes BadgeCanvasRef) |
| `components/ProgressBadgeTab.tsx` | Form + preview layout for progress tab |

## Files to Modify

| File | Change |
|------|--------|
| `components/BadgeCanvas.tsx` | Import shared utilities from `lib/badge-helpers.ts` instead of defining inline. No behavioral changes. |
| `app/page.tsx` | Add tab state, day counter above tabs, render tab content. Wrap existing badge UI in a conditional. Add localStorage save effect. |
| `package.json` | Add `modern-gif` dependency |

## What Does NOT Change

- `components/BadgeCanvas.tsx` — rendering logic, component API, and behavior are identical (only import paths change)
- `components/SharePanel.tsx` — reused as-is by both tabs
- All existing badge functionality — identical behavior

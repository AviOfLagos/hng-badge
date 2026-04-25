import { encode } from "modern-gif";

export interface GifFrame {
  progress: number; // 0–1 animation progress
  delay: number;    // ms to show this frame
}

interface GifOptions {
  width: number;
  height: number;
  frames: GifFrame[];
  drawFrame: (ctx: CanvasRenderingContext2D, progress: number) => void;
}

export async function encodeGif(options: GifOptions): Promise<Blob> {
  const { width, height, frames, drawFrame } = options;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  const encoded: Array<{ pixels: ArrayBuffer; delay: number }> = [];

  for (const frame of frames) {
    ctx.clearRect(0, 0, width, height);
    drawFrame(ctx, frame.progress);
    const imageData = ctx.getImageData(0, 0, width, height);
    encoded.push({ pixels: imageData.data.buffer.slice(0), delay: frame.delay });
  }

  const blob = await encode({
    width,
    height,
    frames: encoded.map((f) => ({
      data: f.pixels,
      delay: f.delay,
    })),
    format: "blob",
  });

  return blob;
}

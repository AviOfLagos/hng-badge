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

  // Collect all frames as raw pixel ArrayBuffers
  const frames: Array<{ pixels: ArrayBuffer; delay: number }> = [];

  for (let i = 0; i < totalFrames; i++) {
    const progress = totalFrames === 1 ? 1 : i / (totalFrames - 1);
    ctx.clearRect(0, 0, width, height);
    drawFrame(ctx, progress);
    const imageData = ctx.getImageData(0, 0, width, height);
    // .slice() creates a proper ArrayBuffer (not SharedArrayBuffer)
    frames.push({ pixels: imageData.data.buffer.slice(0), delay });
  }

  const blob = await encode({
    width,
    height,
    frames: frames.map((f) => ({
      data: f.pixels,
      delay: f.delay,
    })),
    format: "blob",
  });

  return blob;
}

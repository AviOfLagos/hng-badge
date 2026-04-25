import { Encoder } from "modern-gif";

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

  const encoder = new Encoder({
    width,
    height,
    maxColors: 256,
  });

  for (let i = 0; i < totalFrames; i++) {
    const progress = totalFrames === 1 ? 1 : i / (totalFrames - 1);
    ctx.clearRect(0, 0, width, height);
    drawFrame(ctx, progress);
    await encoder.encode({
      data: canvas,
      delay,
    });
  }

  return encoder.flush("blob");
}

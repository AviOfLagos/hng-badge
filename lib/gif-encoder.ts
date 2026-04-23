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

  // Build frames using canvas as CanvasImageSource
  const frames: Array<{ data: HTMLCanvasElement; delay: number }> = [];

  for (let i = 0; i < totalFrames; i++) {
    const progress = totalFrames === 1 ? 1 : i / (totalFrames - 1);
    ctx.clearRect(0, 0, width, height);
    drawFrame(ctx, progress);
    // Clone canvas to a new one for each frame
    const frameCanvas = document.createElement("canvas");
    frameCanvas.width = width;
    frameCanvas.height = height;
    frameCanvas.getContext("2d")!.drawImage(canvas, 0, 0);
    frames.push({ data: frameCanvas, delay });
  }

  const output = await encode({
    width,
    height,
    frames: frames.map((f) => ({
      data: f.data as unknown as CanvasImageSource,
      delay: f.delay,
    })),
    format: "blob",
  });

  return output as Blob;
}

import { hexToRgb, getCornerColor, canvasToBlob, downloadBlob } from './canvas';

export type BgMode = 'color' | 'transparent';

export interface BgOptions {
  mode: BgMode;
  color?: string; // hex like "#ff0000"
  tolerance: number; // 0-100 (color distance threshold)
}

/**
 * Replace background by sampling the corner color as "background" reference,
 * computing per-pixel color distance, and either recoloring or making transparent.
 *
 * This is a simple flood-from-corners style approach:
 *   - BFS from all four corners, marking "background" pixels where the color
 *     distance to the sampled bg is below tolerance.
 *   - Pixels NOT reached are foreground.
 *
 * Better than naive global threshold because it's spatial.
 */
export async function changeBackground(
  source: HTMLCanvasElement,
  options: BgOptions
): Promise<Blob> {
  const ctx = source.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('No ctx');

  const { width, height } = source;
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // 1. Determine background reference color
  const ref = getCornerColor(ctx, width, height);
  const threshold = (options.tolerance / 100) * 255 * 1.732; // sqrt(3) for diagonal

  // 2. Build a mask via flood fill from edges
  const mask = new Uint8Array(width * height); // 1 = background
  const stack: number[] = [];

  // seed: all edge pixels
  for (let x = 0; x < width; x++) {
    stack.push(x, x + (height - 1) * width);
  }
  for (let y = 1; y < height - 1; y++) {
    stack.push(y * width, y * width + (width - 1));
  }

  while (stack.length) {
    const idx = stack.pop()!;
    if (mask[idx]) continue;
    const px = idx * 4;
    const dr = data[px] - ref[0];
    const dg = data[px + 1] - ref[1];
    const db = data[px + 2] - ref[2];
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);
    if (dist > threshold) continue;

    mask[idx] = 1;
    const x = idx % width;
    const y = (idx - x) / width;
    if (x > 0) stack.push(idx - 1);
    if (x < width - 1) stack.push(idx + 1);
    if (y > 0) stack.push(idx - width);
    if (y < height - 1) stack.push(idx + width);
  }

  // 3. Apply mask to a fresh canvas
  const out = document.createElement('canvas');
  out.width = width;
  out.height = height;
  const octx = out.getContext('2d')!;
  const outData = octx.createImageData(width, height);
  const outBuf = outData.data;

  if (options.mode === 'transparent') {
    for (let i = 0; i < mask.length; i++) {
      const si = i * 4;
      if (mask[i]) {
        outBuf[si + 3] = 0;
      } else {
        outBuf[si] = data[si];
        outBuf[si + 1] = data[si + 1];
        outBuf[si + 2] = data[si + 2];
        outBuf[si + 3] = 255;
      }
    }
  } else {
    const [r, g, b] = hexToRgb(options.color ?? '#ffffff');
    for (let i = 0; i < mask.length; i++) {
      const si = i * 4;
      if (mask[i]) {
        outBuf[si] = r;
        outBuf[si + 1] = g;
        outBuf[si + 2] = b;
        outBuf[si + 3] = 255;
      } else {
        outBuf[si] = data[si];
        outBuf[si + 1] = data[si + 1];
        outBuf[si + 2] = data[si + 2];
        outBuf[si + 3] = 255;
      }
    }
  }

  octx.putImageData(outData, 0, 0);
  return await canvasToBlob(out, 'image/png', 0.95);
}

export async function downloadBgResult(
  source: HTMLCanvasElement,
  options: BgOptions,
  filename: string
) {
  const blob = await changeBackground(source, options);
  downloadBlob(blob, filename);
}
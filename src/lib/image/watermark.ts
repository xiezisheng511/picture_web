import { canvasToBlob, downloadBlob } from './canvas';

export interface Region {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type WatermarkMethod = 'blur' | 'fill';

/**
 * Simple inpainting: replace pixels inside `region` based on chosen method.
 *  - blur: gaussian blur sampled from surrounding pixels (simple box blur iter).
 *  - fill: average color of the region's edge (1-px ring) painted across region.
 *
 * For better quality we'd implement Navier-Stokes or patch-based algorithms,
 * but those are heavy. This is a usable first cut.
 */
export async function removeWatermark(
  source: HTMLCanvasElement,
  region: Region,
  method: WatermarkMethod = 'blur'
): Promise<Blob> {
  const { width, height } = source;
  const ctx = source.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('No ctx');

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const { x, y, width: rw, height: rh } = region;
  const x0 = Math.max(0, x);
  const y0 = Math.max(0, y);
  const x1 = Math.min(width, x + rw);
  const y1 = Math.min(height, y + rh);

  if (method === 'fill') {
    // collect edge pixels
    let r = 0,
      g = 0,
      b = 0,
      n = 0;
    for (let yy = y0; yy < y1; yy++) {
      for (let xx = x0; xx < x1; xx++) {
        const isEdge =
          xx === x0 || xx === x1 - 1 || yy === y0 || yy === y1 - 1;
        if (isEdge) {
          const i = (yy * width + xx) * 4;
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          n++;
        }
      }
    }
    r = Math.round(r / Math.max(1, n));
    g = Math.round(g / Math.max(1, n));
    b = Math.round(b / Math.max(1, n));
    for (let yy = y0; yy < y1; yy++) {
      for (let xx = x0; xx < x1; xx++) {
        const i = (yy * width + xx) * 4;
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
      }
    }
  } else {
    // simple multi-pass box blur of the region's interior, mixing with neighbors
    for (let pass = 0; pass < 3; pass++) {
      const copy = new Uint8ClampedArray(data);
      for (let yy = y0 + 1; yy < y1 - 1; yy++) {
        for (let xx = x0 + 1; xx < x1 - 1; xx++) {
          const i = (yy * width + xx) * 4;
          for (let c = 0; c < 3; c++) {
            let sum = 0;
            let cnt = 0;
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                const ni = ((yy + dy) * width + (xx + dx)) * 4;
                sum += copy[ni + c];
                cnt++;
              }
            }
            data[i + c] = Math.round(sum / cnt);
          }
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return await canvasToBlob(source, 'image/png', 0.95);
}

export async function downloadWatermarkResult(
  source: HTMLCanvasElement,
  region: Region,
  method: WatermarkMethod,
  filename: string
) {
  const blob = await removeWatermark(source, region, method);
  downloadBlob(blob, filename);
}
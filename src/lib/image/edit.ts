import { canvasToBlob, downloadBlob } from './canvas';

export type OutputFormat = 'image/png' | 'image/jpeg' | 'image/webp';

export interface ResizeOptions {
  width: number;
  height: number;
  keepRatio: boolean;
}

export function rotate(source: HTMLCanvasElement, degrees: number): HTMLCanvasElement {
  const { width, height } = source;
  const swap = degrees % 180 !== 0;
  const out = document.createElement('canvas');
  out.width = swap ? height : width;
  out.height = swap ? width : height;
  const ctx = out.getContext('2d')!;
  ctx.translate(out.width / 2, out.height / 2);
  ctx.rotate((degrees * Math.PI) / 180);
  ctx.drawImage(source, -width / 2, -height / 2);
  return out;
}

export function flip(source: HTMLCanvasElement, axis: 'h' | 'v'): HTMLCanvasElement {
  const out = document.createElement('canvas');
  out.width = source.width;
  out.height = source.height;
  const ctx = out.getContext('2d')!;
  ctx.translate(axis === 'h' ? out.width : 0, axis === 'v' ? out.height : 0);
  ctx.scale(axis === 'h' ? -1 : 1, axis === 'v' ? -1 : 1);
  ctx.drawImage(source, 0, 0);
  return out;
}

export function resize(source: HTMLCanvasElement, opts: ResizeOptions): HTMLCanvasElement {
  let { width, height } = opts;
  if (opts.keepRatio) {
    const ratio = source.width / source.height;
    if (width / height > ratio) {
      width = Math.round(height * ratio);
    } else {
      height = Math.round(width / ratio);
    }
  }
  const out = document.createElement('canvas');
  out.width = width;
  out.height = height;
  const ctx = out.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, width, height);
  return out;
}

export function crop(
  source: HTMLCanvasElement,
  region: { x: number; y: number; width: number; height: number }
): HTMLCanvasElement {
  const out = document.createElement('canvas');
  out.width = region.width;
  out.height = region.height;
  const ctx = out.getContext('2d')!;
  ctx.drawImage(
    source,
    region.x,
    region.y,
    region.width,
    region.height,
    0,
    0,
    region.width,
    region.height
  );
  return out;
}

export async function exportImage(
  source: HTMLCanvasElement,
  format: OutputFormat,
  quality: number
): Promise<Blob> {
  return await canvasToBlob(source, format, quality);
}

export async function downloadExport(
  source: HTMLCanvasElement,
  format: OutputFormat,
  quality: number,
  filename: string
) {
  const blob = await exportImage(source, format, quality);
  downloadBlob(blob, filename);
}

export function fileExtension(format: OutputFormat): string {
  if (format === 'image/png') return 'png';
  if (format === 'image/jpeg') return 'jpg';
  if (format === 'image/webp') return 'webp';
  return 'png';
}
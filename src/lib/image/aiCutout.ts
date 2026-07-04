import { canvasToBlob, downloadBlob } from './canvas';

const REMOVE_BG_ENDPOINT = 'https://api.remove.bg/v1.0/removebg';

/**
 * Call remove.bg API to extract foreground. Returns a PNG blob with transparency.
 *
 * IMPORTANT: Calling remove.bg from the browser exposes your API key to anyone.
 * For production, route this through a backend proxy. The placeholder below is
 * a thin wrapper that reads the key from `localStorage` for demo purposes only.
 */
export async function aiCutout(file: File): Promise<Blob> {
  const apiKey = window.localStorage.getItem('picedit.removebg_key') ?? '';
  if (!apiKey) {
    throw new Error(
      'Missing remove.bg API key. Set it in localStorage as "picedit.removebg_key" or use the hosted demo.'
    );
  }

  const form = new FormData();
  form.append('image_file', file);
  form.append('size', 'auto');

  const res = await fetch(REMOVE_BG_ENDPOINT, {
    method: 'POST',
    headers: { 'X-Api-Key': apiKey },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`remove.bg error ${res.status}: ${text}`);
  }
  return await res.blob();
}

export async function downloadAiCutout(file: File, filename: string) {
  const blob = await aiCutout(file);
  downloadBlob(blob, filename);
}

/**
 * Composite a cutout PNG blob onto a solid color background.
 */
export async function compositeOnColor(
  cutoutBlob: Blob,
  hexColor: string
): Promise<Blob> {
  const url = URL.createObjectURL(cutoutBlob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = hexColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    return await canvasToBlob(canvas, 'image/png', 0.95);
  } finally {
    URL.revokeObjectURL(url);
  }
}
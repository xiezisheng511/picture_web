/* PicEdit - zero-build static bundle
 * Loads React 18 from cdn.jsdelivr.net via importmap.
 * No bundler, no npm install required. Drop this folder on any static host.
 */
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import htm from 'htm';

const html = htm.bind(React.createElement);

// ============================================================================
// i18n
// ============================================================================
const STORAGE_KEY = 'picedit.lang';
const dict = { zh: null, en: null };

async function loadDict(lang) {
  if (dict[lang]) return dict[lang];
  const res = await fetch(`./assets/i18n/${lang}.json`);
  dict[lang] = await res.json();
  return dict[lang];
}

function detectInitialLang() {
  const saved = localStorage.getItem(STORAGE_KEY);
  // Check if user has explicitly saved a language
  const validLangs = ['zh', 'en', 'tw', 'ja', 'de'];
  if (validLangs.includes(saved)) return saved;
  
  // Auto-detect based on browser language
  const lang = (navigator.language || 'en').toLowerCase();
  
  // Traditional Chinese (Hong Kong, Taiwan, Macau)
  if (lang.startsWith('zh-hant') || lang === 'zh-tw' || lang === 'zh-hk' || lang === 'zh-mo') {
    return 'tw';
  }
  // Simplified Chinese (Mainland China)
  if (lang.startsWith('zh') || lang === 'zh-cn' || lang === 'zh-sg') {
    return 'zh';
  }
  // Japanese
  if (lang.startsWith('ja')) return 'ja';
  // German
  if (lang.startsWith('de')) return 'de';
  // Default to English
  return 'en';
}

const I18nContext = React.createContext({ lang: 'en', t: (k) => k, setLang: () => {} });

function I18nProvider({ children }) {
  const [lang, setLangState] = useState(detectInitialLang());
  const [dict, setDict] = useState(null);

  useEffect(() => {
    loadDict(lang).then(setDict);
  }, [lang]);

  const setLang = useCallback((l) => {
    localStorage.setItem(STORAGE_KEY, l);
    document.documentElement.lang = l;
    setLangState(l);
  }, []);

  const t = useCallback(
    (key) => {
      if (!dict) return key;
      const parts = key.split('.');
      let cur = dict;
      for (const p of parts) {
        if (cur && typeof cur === 'object' && p in cur) cur = cur[p];
        else return key;
      }
      return typeof cur === 'string' ? cur : key;
    },
    [dict]
  );

  if (!dict) {
    return html`<div className="flex-1 flex items-center justify-center text-gray-400">Loading…</div>`;
  }
  return html`<${I18nContext.Provider} value=${{ lang, t, setLang }}>${children}<//>`;
}

const useT = () => React.useContext(I18nContext);

// ============================================================================
// Image processing library
// ============================================================================
const lib = {
  hexToRgb(hex) {
    const m = hex.replace('#', '');
    const v = m.length === 3 ? m.split('').map((c) => c + c).join('') : m;
    const num = parseInt(v, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  },
  async loadImageToCanvas(file) {
    const url = URL.createObjectURL(file);
    const img = new Image();
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
      img.src = url;
    });
    const max = 2048;
    let { naturalWidth: width, naturalHeight: height } = img;
    if (width > max || height > max) {
      const r = Math.min(max / width, max / height);
      width = Math.round(width * r);
      height = Math.round(height * r);
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, width, height);
    URL.revokeObjectURL(url);
    return { canvas, ctx, width, height };
  },
  canvasToBlob(canvas, type = 'image/png', quality = 0.92) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), type, quality);
    });
  },
  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
  cornerColor(ctx, w, h) {
    // Sample a 5x5 region at each corner and return the lightest color
    // (background is usually the brightest region — a person's skin/hair
    //  is darker than white background).
    const samples = [
      [0, 0], [w - 5, 0], [0, h - 5], [w - 5, h - 5],
    ];
    let bestR = 255, bestG = 255, bestB = 255, bestSum = -1;
    for (const [sx, sy] of samples) {
      let r = 0, g = 0, b = 0, n = 0;
      for (let dy = 0; dy < 5; dy++) {
        for (let dx = 0; dx < 5; dx++) {
          const d = ctx.getImageData(sx + dx, sy + dy, 1, 1).data;
          r += d[0]; g += d[1]; b += d[2]; n++;
        }
      }
      r /= n; g /= n; b /= n;
      const sum = r + g + b;
      if (sum > bestSum) { bestSum = sum; bestR = r; bestG = g; bestB = b; }
    }
    return [Math.round(bestR), Math.round(bestG), Math.round(bestB)];
  },
  async changeBackground(source, { mode, color, tolerance }) {
    const ctx = source.getContext('2d', { willReadFrequently: true });
    const { width, height } = source;
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    const ref = lib.cornerColor(ctx, width, height);
    // RGB → approximate CIE-Lab lightness (0-100 scale).
    // Use luminance difference instead of raw RGB distance — much more
    // robust for white backgrounds because shadowed/anti-aliased edges
    // of the foreground still have very different lightness.
    const refLum = 0.299 * ref[0] + 0.587 * ref[1] + 0.114 * ref[2];
    // tolerance 0-100 maps to lightness delta 0-60 (very forgiving to 255 white)
    const threshold = (tolerance / 100) * 60;
    const mask = new Uint8Array(width * height);
    const stack = [];
    for (let x = 0; x < width; x++) {
      stack.push(x);
      stack.push(x + (height - 1) * width);
    }
    for (let y = 1; y < height - 1; y++) {
      stack.push(y * width);
      stack.push(y * width + (width - 1));
    }
    while (stack.length) {
      const idx = stack.pop();
      if (mask[idx]) continue;
      const px = idx * 4;
      const dr = data[px] - ref[0], dg = data[px + 1] - ref[1], db = data[px + 2] - ref[2];
      // Combine: Euclidean distance + luminance delta (both must agree it's "background-like")
      const euclid = Math.sqrt(dr * dr + dg * dg + db * db);
      const lum = 0.299 * data[px] + 0.587 * data[px + 1] + 0.114 * data[px + 2];
      const lumDelta = Math.abs(lum - refLum);
      // Pixel counts as background only if BOTH:
      // - colour distance ≤ threshold (e.g. 154 at tol=35)
      // - luminance is within tolerance of bg luminance
      if (euclid > threshold * 4 || lumDelta > threshold) continue;
      mask[idx] = 1;
      const x = idx % width, y = (idx - x) / width;
      if (x > 0) stack.push(idx - 1);
      if (x < width - 1) stack.push(idx + 1);
      if (y > 0) stack.push(idx - width);
      if (y < height - 1) stack.push(idx + width);
    }

    // Two-step refinement of the mask:
//   1) DILATE foreground (mask=0) outward by `erode` pixels — this swallows
//      anti-aliased white edge pixels so they become background.
//   2) DILATE again by `restore` pixels with alpha feathering — restores
//      the original foreground size but with a soft, halo-free edge.
//
// Implementation: build "tight" mask via BFS-based erosion, then
// distance-to-bg for feathering.

    // Step 1: erode mask (background grows into foreground by `erode` pixels)
    const erode = 2;
    const tight = new Uint8Array(mask.length);
    // Initialise: copy mask
    for (let i = 0; i < tight.length; i++) tight[i] = mask[i];
    // Erode: for each pixel, if any neighbour within radius is foreground,
    // it's still foreground; otherwise it's background
    for (let pass = 0; pass < erode; pass++) {
      const prev = new Uint8Array(tight);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = y * width + x;
          if (prev[i]) continue; // already bg, stays bg
          // It's foreground. Check 3x3 neighbourhood — if any neighbour is bg, become bg
          let isEdge = false;
          for (let dy = -1; dy <= 1 && !isEdge; dy++) {
            const ny = y + dy;
            if (ny < 0 || ny >= height) continue;
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const nx = x + dx;
              if (nx < 0 || nx >= width) continue;
              if (prev[ny * width + nx]) { isEdge = true; break; }
            }
          }
          if (isEdge) tight[i] = 1; // edge fg → become bg
        }
      }
    }

    // Step 2: distance transform from bg pixels
    const distToBg = new Int16Array(mask.length);
    for (let i = 0; i < distToBg.length; i++) distToBg[i] = 32767;
    const bfsQueue = [];
    for (let i = 0; i < tight.length; i++) {
      if (tight[i]) {
        distToBg[i] = 0;
        bfsQueue.push(i);
      }
    }
    while (bfsQueue.length) {
      const idx = bfsQueue.shift();
      const d = distToBg[idx];
      if (d >= 8) continue; // we only need distance up to 8 (expand radius)
      const x = idx % width, y = (idx - x) / width;
      const neighbours = [
        x > 0 ? idx - 1 : -1,
        x < width - 1 ? idx + 1 : -1,
        y > 0 ? idx - width : -1,
        y < height - 1 ? idx + width : -1,
      ];
      for (const n of neighbours) {
        if (n < 0) continue;
        if (distToBg[n] > d + 1) {
          distToBg[n] = d + 1;
          bfsQueue.push(n);
        }
      }
    }

    // Now write output:
    //  - distToBg === 0  → background → new bg colour
    //  - distToBg > 0 && <= feather → feathering zone → alpha based on distance
    //  - distToBg > feather → fully foreground
    const feather = 4;
    const out = document.createElement('canvas');
    out.width = width;
    out.height = height;
    const octx = out.getContext('2d');
    const outData = octx.createImageData(width, height);
    const buf = outData.data;

    if (mode === 'transparent') {
      for (let i = 0; i < mask.length; i++) {
        const si = i * 4;
        if (distToBg[i] === 0) {
          buf[si] = 0; buf[si + 1] = 0; buf[si + 2] = 0; buf[si + 3] = 0;
        } else if (distToBg[i] <= feather) {
          // Edge feather zone: output original pixel with partial alpha
          // so anti-aliased halo blends smoothly with whatever is behind.
          const a = Math.round((distToBg[i] / feather) * 255);
          buf[si] = data[si]; buf[si + 1] = data[si + 1]; buf[si + 2] = data[si + 2];
          buf[si + 3] = a;
        } else {
          buf[si] = data[si]; buf[si + 1] = data[si + 1]; buf[si + 2] = data[si + 2];
          buf[si + 3] = 255;
        }
      }
    } else {
      const [nr, ng, nb] = lib.hexToRgb(color || '#ffffff');
      // Pre-composite foreground with new bg colour so the PNG is fully
      // opaque — the edge alpha is resolved here, not left for the PNG
      // viewer to guess at (which would fall back to white).
      for (let i = 0; i < mask.length; i++) {
        const si = i * 4;
        if (distToBg[i] === 0) {
          buf[si] = nr; buf[si + 1] = ng; buf[si + 2] = nb; buf[si + 3] = 255;
        } else if (distToBg[i] <= feather) {
          // Composite: out = src * a + bg * (1-a)
          const a = distToBg[i] / feather;
          buf[si] = Math.round(data[si] * a + nr * (1 - a));
          buf[si + 1] = Math.round(data[si + 1] * a + ng * (1 - a));
          buf[si + 2] = Math.round(data[si + 2] * a + nb * (1 - a));
          buf[si + 3] = 255;
        } else {
          buf[si] = data[si]; buf[si + 1] = data[si + 1]; buf[si + 2] = data[si + 2];
          buf[si + 3] = 255;
        }
      }
    }
    octx.putImageData(outData, 0, 0);
    return await lib.canvasToBlob(out, 'image/png', 0.95);
  },
  async removeWatermark(source, regionOrRegions, method = 'blur') {
    const { width, height } = source;
    const regions = Array.isArray(regionOrRegions) ? regionOrRegions : (regionOrRegions ? [regionOrRegions] : []);
    if (regions.length === 0) return await lib.canvasToBlob(source, 'image/png', 0.95);
    // Expand a single selection with margin so the model has context to fill from.
    if (method === 'ai') {
      return await lib._lamaInpaint(source, regions);
    }
    // For 'blur' and 'fill': process each region sequentially using self-developed algorithm
    for (const region of regions) {
      await lib._selfInpaint(source, region, method);
    }
    return await lib.canvasToBlob(source, 'image/png', 0.95);
  },
  async _lamaInpaint(source, regions) {
    // Fallback self-developed algorithm (works without external models)
    const { width, height } = source;
    const ctx = source.getContext('2d', { willReadFrequently: true });
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    const { x, y, width: rw, height: rh } = region;
    const x0 = Math.max(0, x), y0 = Math.max(0, y);
    const x1 = Math.min(width, x + rw), y1 = Math.min(height, y + rh);
    if (x1 <= x0 || y1 <= y0) return;

    // Lazy-load ONNX Runtime Web on first use
    if (!window.ort) {
      await new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.bootcdn.net/ajax/libs/onnxruntime-web/1.23.0/ort.min.js';
        s.onload = res;
        s.onerror = () => rej(new Error('Failed to load onnxruntime-web'));
        document.head.appendChild(s);
      });
    }
    window.ort.env.wasm.wasmPaths = 'https://cdn.bootcdn.net/ajax/libs/onnxruntime-web/1.23.0/';

    // Lazy-create ORT session (model URL is set by UI to blob URL of downloaded model)
    if (!window.__lamaSession) {
      const modelUrl = window.__lamaModelUrl || 'https://xiezisheng511.github.io/picture_web/models/lama_512_int8.onnx';
      window.__lamaSession = await window.ort.InferenceSession.create(modelUrl, {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all',
      });
    }
    const session = window.__lamaSession;
    const ort = window.ort;

    // LaMa expects input shape [1, 3, H, W] (RGB float32) and mask [1, 1, H, W] (float 0/1)
    // Resize to multiple of 8 (LaMa requirement)
    // LaMa ONNX model expects fixed 512×512 input. We extract the
    // selection + a small context margin, resize to 512×512, run
    // inference, then upscale result back and composite.
    const MODEL_SIZE = 512;
    // Add a margin around the selection so LaMa has context to fill from
    const margin = Math.round(Math.max(x1 - x0, y1 - y0) * 0.3);
    const cropX0 = Math.max(0, x0 - margin);
    const cropY0 = Math.max(0, y0 - margin);
    const cropX1 = Math.min(width, x1 + margin);
    const cropY1 = Math.min(height, y1 + margin);
    const cropW = cropX1 - cropX0;
    const cropH = cropY1 - cropY0;

    // Crop the source into a 512x512 canvas (covers the selection area
    // plus margin; the rest of the model input is background context).
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = MODEL_SIZE; cropCanvas.height = MODEL_SIZE;
    const cctx = cropCanvas.getContext('2d');
    cctx.drawImage(source, cropX0, cropY0, cropW, cropH, 0, 0, MODEL_SIZE, MODEL_SIZE);
    const cropImg = cctx.getImageData(0, 0, MODEL_SIZE, MODEL_SIZE);
    const cData = cropImg.data;

    // LaMa lama_512_int8 expects input tensor [1, 4, 512, 512]:
    //   channels 0-2: masked image RGB (0-1, region inside mask is 0)
    //   channel 3:   binary mask (1 = to inpaint)
    // Per g-ronimo/lama README: "Channels 0-2: masked image (RGB, 0-1,
    //   masked region zeroed out). Channel 3: binary mask (0 or 1)."
    const imgSize = MODEL_SIZE * MODEL_SIZE;
    // Flatten [1, 4, 512, 512] = 4 * 512 * 512 = 1,048,576 floats
    const inputData = new Float32Array(4 * imgSize);
    // Convert selection rectangle in original coords to model coords
    const scaleX = MODEL_SIZE / cropW;
    const scaleY = MODEL_SIZE / cropH;
    const mx0 = (x0 - cropX0) * scaleX;
    const my0 = (y0 - cropY0) * scaleY;
    const mx1 = (x1 - cropX0) * scaleX;
    const my1 = (y1 - cropY0) * scaleY;
    for (let y = 0; y < MODEL_SIZE; y++) {
      for (let x = 0; x < MODEL_SIZE; x++) {
        const i = y * MODEL_SIZE + x;
        const si = i * 4;
        // Channel 3 (mask): 1 inside selection, 0 outside
        const inMask = (x >= mx0 && x < mx1 && y >= my0 && y < my1) ? 1.0 : 0.0;
        inputData[3 * imgSize + i] = inMask;
        if (inMask > 0) {
          // Inside mask: zero out RGB (model expects masked image)
          inputData[i] = 0;
          inputData[imgSize + i] = 0;
          inputData[2 * imgSize + i] = 0;
        } else {
          // Outside mask: pass through original RGB normalised to 0-1
          inputData[i] = cData[si] / 255;
          inputData[imgSize + i] = cData[si + 1] / 255;
          inputData[2 * imgSize + i] = cData[si + 2] / 255;
        }
      }
    }

    const inputTensor = new ort.Tensor('float32', inputData, [1, 4, MODEL_SIZE, MODEL_SIZE]);

    // Run inference. The model may name the input 'input' or 'image'.
    const inputName = session.inputNames[0] || 'input';
    const feeds = {};
    feeds[inputName] = inputTensor;
    const results = await session.run(feeds);

    // Result shape: [1, 3, 512, 512], RGB float32 (0-1)
    const outData = results[Object.keys(results)[0]].data;

    // Build 512x512 result canvas
    const outCropCanvas = document.createElement('canvas');
    outCropCanvas.width = MODEL_SIZE; outCropCanvas.height = MODEL_SIZE;
    const octx = outCropCanvas.getContext('2d');
    const outImg = octx.createImageData(MODEL_SIZE, MODEL_SIZE);
    for (let y = 0; y < MODEL_SIZE; y++) {
      for (let x = 0; x < MODEL_SIZE; x++) {
        const i = y * MODEL_SIZE + x;
        const di = i * 4;
        outImg.data[di] = Math.round(Math.max(0, Math.min(1, outData[i])) * 255);
        outImg.data[di + 1] = Math.round(Math.max(0, Math.min(1, outData[imgSize + i])) * 255);
        outImg.data[di + 2] = Math.round(Math.max(0, Math.min(1, outData[2 * imgSize + i])) * 255);
        outImg.data[di + 3] = 255;
      }
    }
    octx.putImageData(outImg, 0, 0);

    // Composite result back to source canvas (only inside the crop region)
    const finalctx = source.getContext('2d');
    finalctx.save();
    finalctx.beginPath();
    finalctx.rect(cropX0, cropY0, cropW, cropH);
    finalctx.clip();
    finalctx.drawImage(outCropCanvas, 0, 0, MODEL_SIZE, MODEL_SIZE, cropX0, cropY0, cropW, cropH);
    finalctx.restore();

    return await lib.canvasToBlob(source, 'image/png', 0.95);
  },

  async _selfInpaint(source, region, method) {
    // Self-developed algorithm: no external model needed.
    // - 'fill': sample background colour from corners and fill selection
    // - 'blur': apply box blur to selection area
    const { width, height } = source;
    const ctx = source.getContext('2d', { willReadFrequently: true });
    const x = Math.max(0, region.x);
    const y = Math.max(0, region.y);
    const w = Math.min(width - x, region.width);
    const h = Math.min(height - y, region.height);
    if (w <= 0 || h <= 0) return;
    const imgData = ctx.getImageData(x, y, w, h);
    const data = imgData.data;
    if (method === 'fill') {
      // Sample 4 corners (5x5) to find most common bg colour
      const samples = [];
      const tryAdd = (cx, cy) => {
        if (cx < 0 || cy < 0 || cx >= width || cy >= height) return;
        const i = (cy * width + cx) * 4;
        samples.push([data[i], data[i+1], data[i+2]]);
      };
      // Sample just outside the selection
      for (let dy = 0; dy < 5; dy++) {
        for (let dx = 0; dx < 5; dx++) {
          tryAdd(x - 1 - dx, y - 1 - dy);
          tryAdd(x + w + dx, y - 1 - dy);
          tryAdd(x - 1 - dx, y + h + dy);
          tryAdd(x + w + dx, y + h + dy);
        }
      }
      if (samples.length === 0) return;
      // Use mode (most common colour, bucketed)
      const buckets = new Map();
      for (const [r, g, b] of samples) {
        const key = `${r >> 4},${g >> 4},${b >> 4}`;
        buckets.set(key, (buckets.get(key) || 0) + 1);
      }
      let bestKey = null, bestCount = 0;
      for (const [k, c] of buckets) {
        if (c > bestCount) { bestCount = c; bestKey = k; }
      }
      const [br, bg, bb] = bestKey.split(',').map(Number);
      const fillR = br * 16 + 8, fillG = bg * 16 + 8, fillB = bb * 16 + 8;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = fillR; data[i+1] = fillG; data[i+2] = fillB;
      }
    } else {
      // 'blur': 3-pass box blur (radius 3)
      const r = 3;
      const tmp = new Uint8ClampedArray(data.length);
      for (let pass = 0; pass < 3; pass++) {
        const src = pass % 2 === 0 ? data : tmp;
        const dst = pass % 2 === 0 ? tmp : data;
        for (let yy = 0; yy < h; yy++) {
          for (let xx = 0; xx < w; xx++) {
            let rSum = 0, gSum = 0, bSum = 0, n = 0;
            for (let dy = -r; dy <= r; dy++) {
              const sy = yy + dy;
              if (sy < 0 || sy >= h) continue;
              for (let dx = -r; dx <= r; dx++) {
                const sx = xx + dx;
                if (sx < 0 || sx >= w) continue;
                const i = (sy * w + sx) * 4;
                rSum += src[i]; gSum += src[i+1]; bSum += src[i+2]; n++;
              }
            }
            const i = (yy * w + xx) * 4;
            dst[i] = rSum / n; dst[i+1] = gSum / n; dst[i+2] = bSum / n;
          }
        }
      }
    }
    ctx.putImageData(imgData, x, y);
  },  rotate(source, deg) {
    const swap = deg % 180 !== 0;
    const out = document.createElement('canvas');
    out.width = swap ? source.height : source.width;
    out.height = swap ? source.width : source.height;
    const ctx = out.getContext('2d');
    ctx.translate(out.width / 2, out.height / 2);
    ctx.rotate((deg * Math.PI) / 180);
    ctx.drawImage(source, -source.width / 2, -source.height / 2);
    return out;
  },
  flip(source, axis) {
    const out = document.createElement('canvas');
    out.width = source.width; out.height = source.height;
    const ctx = out.getContext('2d');
    ctx.translate(axis === 'h' ? out.width : 0, axis === 'v' ? out.height : 0);
    ctx.scale(axis === 'h' ? -1 : 1, axis === 'v' ? -1 : 1);
    ctx.drawImage(source, 0, 0);
    return out;
  },
  resize(source, { width, height, keepRatio }) {
    if (keepRatio) {
      const r = source.width / source.height;
      if (width / height > r) width = Math.round(height * r);
      else height = Math.round(width / r);
    }
    const out = document.createElement('canvas');
    out.width = width; out.height = height;
    const ctx = out.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, 0, 0, width, height);
    return out;
  },
  async aiCutout(file) {
    const key = localStorage.getItem('picedit.removebg_key') || '';
    if (!key) throw new Error('Missing remove.bg API key');
    const fd = new FormData();
    fd.append('image_file', file);
    fd.append('size', 'auto');
    const res = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': key },
      body: fd,
    });
    if (!res.ok) throw new Error(`remove.bg ${res.status}: ${await res.text()}`);
    return res.blob();
  },
  async compositeOnColor(cutoutBlob, hex) {
    const url = URL.createObjectURL(cutoutBlob);
    const img = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    URL.revokeObjectURL(url);
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const ctx = c.getContext('2d');
    ctx.fillStyle = hex; ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0);
    return lib.canvasToBlob(c, 'image/png', 0.95);
  },
};

// ============================================================================
// Hash router
// ============================================================================
const RouterContext = React.createContext({ path: '/', navigate: () => {} });
function useRouter() { return React.useContext(RouterContext); }

function Router({ children }) {
  const [path, setPath] = useState(window.location.hash.replace(/^#/, '') || '/');
  useEffect(() => {
    const onHash = () => setPath(window.location.hash.replace(/^#/, '') || '/');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const navigate = useCallback((p) => { window.location.hash = p; }, []);
  return html`<${RouterContext.Provider} value=${{ path, navigate }}>${children}<//>`;
}

function Link({ to, className, children }) {
  const r = useRouter();
  const isActive = r.path === to;
  return html`<a href=${'#' + to} onClick=${(e) => { e.preventDefault(); r.navigate(to); }} className=${className} aria-current=${isActive ? 'page' : undefined}>${children}</a>`;
}

// ============================================================================
// Shared components
// ============================================================================
function AdSlot({ size = 'banner' }) {
  const { t } = useT();
  const heights = { banner: 'min-h-[90px]', sidebar: 'min-h-[250px]', inline: 'min-h-[120px]' };
  return html`
    <div className=${`w-full bg-gray-50 border border-dashed border-gray-200 rounded-md flex items-center justify-center text-xs text-gray-400 ${heights[size]}`}>
      <div className="text-center px-4">
        <div className="uppercase tracking-wider mb-1">${t('home.adNote')}</div>
        <div className="text-gray-300">${t('ad.placeholder')}</div>
      </div>
    `;
}

function Header() {
  const { t, lang, setLang } = useT();
  const r = useRouter();
  const navCls = (active) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${active ? 'text-primary-600 bg-primary-50' : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'}`;
  const onPath = (p) => r.path === p || (p !== '/' && r.path.startsWith(p));
  return html`
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <${Link} to="/" className="flex items-center gap-2">
            <img src="./favicon.svg" alt="PicEdit" className="w-8 h-8" />
            <span className="font-bold text-lg text-gray-900">${t('site.name')}</span>
          <//>
          <nav className="hidden md:flex items-center gap-1">
            <${Link} to="/" className=${navCls(r.path === '/')}>${t('nav.home')}<//>
            <${Link} to="/tools/bg-color" className=${navCls(onPath('/tools/bg-color'))}>${t('tools.bgColor.title')}<//>
            <${Link} to="/tools/remove-watermark" className=${navCls(onPath('/tools/remove-watermark'))}>${t('tools.removeWatermark.title')}<//>
            <${Link} to="/tools/edit" className=${navCls(onPath('/tools/edit'))}>${t('tools.edit.title')}<//>
            <${Link} to="/tools/ai-cutout" className=${navCls(onPath('/tools/ai-cutout'))}>${t('tools.aiCutout.title')}<//>
            <${Link} to="/about" className=${navCls(onPath('/about'))}>${t('nav.about')}<//>
          </nav>
          <select aria-label=${t('nav.language')} value=${lang} onChange=${(e) => setLang(e.target.value)}
            className="text-sm border border-gray-200 rounded-md px-2 py-1 bg-white hover:border-primary-500">
            <option value="zh">简体中文</option>
            <option value="tw">繁體中文</option>
            <option value="ja">日本語</option>
            <option value="de">Deutsch</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>
    </header>`;
}

function Footer() {
  const { t } = useT();
  return html`
    <footer className="border-t border-gray-100 bg-gray-50 mt-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="./favicon.svg" alt="PicEdit" className="w-6 h-6" />
            <span className="text-sm text-gray-600">${t('footer.copyright')}</span>
          </div>
          <nav className="flex items-center gap-6 text-sm">
            <${Link} to="/privacy" className="text-gray-600 hover:text-primary-600">${t('footer.privacy')}<//>
            <${Link} to="/terms" className="text-gray-600 hover:text-primary-600">${t('footer.terms')}<//>
            <${Link} to="/about" className="text-gray-600 hover:text-primary-600">${t('footer.contact')}<//>
          </nav>
        </div>
      </div>
    </footer>`;
}

function TopBanner() {
  return html`<div className="w-full bg-gray-50 border-b border-gray-100"><div className="max-w-6xl mx-auto px-4 sm:px-6 py-2"><${AdSlot} size="banner" /></div></div>`;
}

function Button({ variant = 'primary', size = 'md', className = '', children, ...rest }) {
  const v = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600 hover:shadow-md',
    secondary: 'bg-white text-primary-600 border border-primary-500 hover:bg-primary-50',
    ghost: 'text-gray-700 hover:bg-gray-100',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  }[variant];
  const s = { sm: 'text-sm px-3 py-1.5', md: 'text-sm px-4 py-2', lg: 'text-base px-6 py-3' }[size];
  return html`<button className=${`inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] ${v} ${s} ${className}`} ...${rest}>${children}</button>`;
}

function ImageUploader({ onLoad }) {
  const { t } = useT();
  const [over, setOver] = useState(false);
  const [err, setErr] = useState(null);
  const handle = useCallback(async (f) => {
    setErr(null);
    if (!f.type.startsWith('image/')) { setErr(t('uploader.invalidType')); return; }
    if (f.size > 10 * 1024 * 1024) { setErr(t('uploader.tooLarge')); return; }
    const { canvas, width, height } = await lib.loadImageToCanvas(f);
    onLoad({ file: f, dataUrl: canvas.toDataURL('image/png'), width, height, size: f.size }, canvas);
  }, [onLoad, t]);
  return html`
    <div onDragOver=${(e) => { e.preventDefault(); setOver(true); }} onDragLeave=${() => setOver(false)}
         onDrop=${(e) => { e.preventDefault(); setOver(false); if (e.dataTransfer.files[0]) handle(e.dataTransfer.files[0]); }}
         onClick=${() => document.getElementById('hi').click()}
         className=${`border-2 border-dashed rounded-2xl p-12 text-center transition-colors cursor-pointer ${over ? 'border-primary-500 bg-primary-50' : 'border-gray-300 bg-white hover:border-primary-400'}`}>
      <input id="hi" type="file" accept="image/*" className="hidden" onChange=${(e) => { if (e.target.files[0]) handle(e.target.files[0]); }} />
      <div className="text-5xl mb-3">📁</div>
      <p className="text-base text-gray-700 font-medium">${t('uploader.title')}</p>
      <p className="text-sm text-gray-500 my-2">${t('uploader.or')}</p>
      <span className="inline-block px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium">${t('uploader.browse')}</span>
      <p className="text-xs text-gray-400 mt-3">${t('uploader.hint')}</p>
      ${err && html`<p className="text-sm text-red-500 mt-3">${err}</p>`}
    `;
}

function Preview({ src, checkerboard }) {
  return html`<div className=${`rounded-lg overflow-hidden border border-gray-200 ${checkerboard ? 'bg-checkerboard' : 'bg-gray-50'}`}>
    <img src=${src} alt="preview" className="block max-w-full max-h-96 mx-auto object-contain" />
  </div>`;
}

function Spinner({ label, progress }) {
  return html`<div className="flex flex-col items-center justify-center gap-3 py-6 w-full px-4">
    <svg className="animate-spin h-8 w-8 text-primary-500" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-opacity="0.2" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
    </svg>
    <p className="text-sm text-gray-500 text-center">${label || t('common.processing')}</p>
    ${progress !== undefined && progress !== null ? html`
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div className="bg-primary-500 h-2 transition-all" style=${{ width: progress + '%' }}></div>
      </div>
      <p className="text-xs text-gray-400">${progress.toFixed(0)}%</p>
    ` : null}
  </div>`;
}

async function fetchWithProgress(url, onProgress) {
  let resp;
  try {
    resp = await fetch(url, { mode: 'cors', credentials: 'omit' });
  } catch (e) {
    throw new Error(`fetch failed (${e.message}). URL: ${url}. Try hard-refresh or clear site data.`);
  }
  if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${url}`);
  const total = parseInt(resp.headers.get('content-length') || '0', 10);
  const reader = resp.body.getReader();
  const chunks = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    if (total) onProgress(received / total * 100);
  }
  const blob = new Blob(chunks);
  return blob;
}

function loadScript(src) {
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = res;
    s.onerror = () => rej(new Error('Failed to load ' + src));
    document.head.appendChild(s);
  });
}

function ColorPicker({ value, onChange, presets }) {
  return html`<div className="flex items-center gap-3">
    <input type="color" value=${value} onChange=${(e) => onChange(e.target.value)} className="w-10 h-10 rounded-md border border-gray-200 cursor-pointer" />
    <input type="text" value=${value} onChange=${(e) => onChange(e.target.value)} className="w-24 px-2 py-1.5 text-sm border border-gray-200 rounded-md font-mono" />
    ${presets && html`<div className="flex items-center gap-1">${presets.map((c) => html`<button key=${c} onClick=${() => onChange(c)} className="w-6 h-6 rounded border border-gray-200 hover:scale-110 transition-transform" style=${{ backgroundColor: c }}></button>`)}</div>`}
  </div>`;
}

// ============================================================================
// Pages
// ============================================================================
function Home() {
  const { t } = useT();
  const tools = [
    { id: 'bg-color', icon: '🎨', title: t('tools.bgColor.title'), desc: t('tools.bgColor.desc'), path: '/tools/bg-color' },
    { id: 'rm', icon: '🧽', title: t('tools.removeWatermark.title'), desc: t('tools.removeWatermark.desc'), path: '/tools/remove-watermark' },
    { id: 'edit', icon: '✂️', title: t('tools.edit.title'), desc: t('tools.edit.desc'), path: '/tools/edit' },
    { id: 'ai', icon: '🤖', title: t('tools.aiCutout.title'), desc: t('tools.aiCutout.desc'), path: '/tools/ai-cutout' },
  ];
  return html`
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <section className="py-16 sm:py-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-500/10 text-accent-500 text-xs font-medium mb-6">${t('home.trustBadge')}</div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 tracking-tight">${t('home.heroTitle')}</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">${t('home.heroSubtitle')}</p>
        <div className="flex items-center justify-center gap-3">
          <a href="#tools"><${Button} size="lg">${t('home.ctaPrimary')}<//></a>
          <${Link} to="/about"><${Button} size="lg" variant="ghost">${t('home.ctaSecondary')}<//><//>
        </div>
      </section>
      <section className="mb-12"><${AdSlot} size="inline" /></section>
      <section id="tools" className="pb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">${t('home.toolsTitle')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          ${tools.map((tool) => html`
            <${Link} key=${tool.id} to=${tool.path} className="group block bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div className="text-4xl mb-3">${tool.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">${tool.title}</h3>
              <p className="text-sm text-gray-600">${tool.desc}</p>
            <//>`)}
        </div>
      </section>
      <section className="py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">${t('home.featuresTitle')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          ${[
            { icon: '🔒', title: lang => lang === 'zh' ? '隐私优先' : 'Privacy first', desc: lang => lang === 'zh' ? '文件不上传服务器' : 'Files never leave your device' },
            { icon: '⚡', title: lang => lang === 'zh' ? '快速处理' : 'Fast', desc: lang => lang === 'zh' ? '浏览器本地运算，秒级完成' : 'Browser-local, sub-second results' },
            { icon: '🆓', title: lang => lang === 'zh' ? '完全免费' : 'Free', desc: lang => lang === 'zh' ? '无注册、无水印、无限制' : 'No signup, no watermark, no limits' },
          ].map((f) => html`
            <div key=${f.icon} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm text-center">
              <div className="text-3xl mb-2">${f.icon}</div>
              <h3 className="font-semibold text-gray-900">${f.title(useT().lang)}</h3>
              <p className="text-sm text-gray-600 mt-1">${f.desc(useT().lang)}</p>
            </div>`)}
        </div>
      </section>
      <section className="py-12 border-t border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">${t('home.seoTitle')}</h2>
        <p className="text-gray-700 leading-relaxed">${t('home.seoContent')}</p>
      </section>
      <section className="py-8"><${AdSlot} size="banner" /></section>
    </div>`;
}

function BgColor() {
  const { t } = useT();
  const [src, setSrc] = useState(null);
  const [color, setColor] = useState('#ffffff');
  const [tol, setTol] = useState(12);
  const [trans, setTrans] = useState(false);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  async function process() {
    if (!src) return;
    setBusy(true); setErr(null);
    try {
      const blob = await lib.changeBackground(src.canvas, { mode: trans ? 'transparent' : 'color', color: trans ? undefined : color, tolerance: tol });
      if (result) URL.revokeObjectURL(result);
      setResult(URL.createObjectURL(blob));
    } catch (e) { setErr(String(e)); }
    finally { setBusy(false); }
  }
  async function download() {
    if (!src || !result) return;
    const blob = await lib.changeBackground(src.canvas, { mode: trans ? 'transparent' : 'color', color: trans ? undefined : color, tolerance: tol });
    lib.downloadBlob(blob, `picedit-bg-${Date.now()}.png`);
  }

  return html`
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">${t('tools.bgColor.title')}</h1>
        <p className="text-gray-600 mt-1">${t('tools.bgColor.desc')}</p>
      </header>
      <${AdSlot} size="inline" className="mb-6" />
      ${!src ? html`<${ImageUploader} onLoad=${(img, canvas) => setSrc({ img, canvas })} />` : html`
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">${t('common.before')}</p>
              <${Preview} src=${src.img.dataUrl} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">${t('common.after')}</p>
              ${result ? html`<${Preview} src=${result} checkerboard=${trans} />` : html`
                <div className="rounded-lg border border-dashed border-gray-300 h-64 flex items-center justify-center">
                  ${busy ? html`<${Spinner} label=${t('common.processing')} />` : html`<span className="text-gray-400 text-sm">${t('common.process') + ' →'}</span>`}
                </div>`}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <input type="checkbox" checked=${trans} onChange=${(e) => setTrans(e.target.checked)} />
                ${t('bgColor.transparent')}
              </label>
              ${!trans && html`<div>
                <p className="text-xs text-gray-500 mb-1">${t('bgColor.presets')}</p>
                <${ColorPicker} value=${color} onChange=${setColor} presets=${['#ffffff', '#ff0000', '#1e40af', '#10b981', '#000000']} />
              </div>`}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">${t('bgColor.tolerance')}: ${tol}</label>
              <input type="range" min=${5} max=${80} value=${tol} onChange=${(e) => setTol(Number(e.target.value))} className="w-full" />
              <p className="text-xs text-gray-400 mt-1">${t('bgColor.edgeHint')}</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <${Button} onClick=${process} disabled=${busy}>${busy ? t('common.processing') : t('common.process')}<//>
              ${result && html`<${Button} variant="secondary" onClick=${download}>⬇️ ${t('common.download')}<//>`}`}
              <${Button} variant="ghost" onClick=${() => { setSrc(null); setResult(null); }}>${t('common.reset')}<//>
            </div>
            ${err && html`<p className="text-sm text-red-500">${err}</p>`}
          </div>
        </div>`}
    `;
}

// CDN auto-selection for fastest loading
const CDN_CANDIDATES = [
  'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.23.0/',
  'https://cdn.bootcdn.net/ajax/libs/onnxruntime-web/1.23.0/',
  'https://unpkg.com/onnxruntime-web@1.23.0/',
];
let selectedCDN = null;

async function getFastestCDN() {
  if (selectedCDN) return selectedCDN;
  const results = [];
  for (const url of CDN_CANDIDATES) {
    try {
      const start = performance.now();
      await fetch(url + 'ort.wasm.min.js', { method: 'HEAD', mode: 'no-cors' });
      results.push({ url, time: performance.now() - start });
    } catch {}
  }
  if (results.length > 0) {
    results.sort((a, b) => a.time - b.time);
    selectedCDN = results[0].url;
  } else {
    selectedCDN = CDN_CANDIDATES[0];
  }
  return selectedCDN;
}

function RemoveWatermark() {
  const { t } = useT();
  const [src, setSrc] = useState(null);
  const [sels, setSels] = useState([]);
  const [drag, setDrag] = useState(null);
  const [method, setMethod] = useState("blur");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [err, setErr] = useState(null);
  const imgRef = useRef(null);
  const start = useRef(null);

  const onDown = (e) => {
    if (!imgRef.current) return;
    e.preventDefault();
    const r = imgRef.current.getBoundingClientRect();
    const sx = imgRef.current.naturalWidth / r.width;
    const sy = imgRef.current.naturalHeight / r.height;
    start.current = { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy };
  };

  const onMove = (e) => {
    if (!start.current || !imgRef.current) return;
    const r = imgRef.current.getBoundingClientRect();
    const sx = imgRef.current.naturalWidth / r.width;
    const sy = imgRef.current.naturalHeight / r.height;
    const cur = { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy };
    setDrag({
      x: Math.min(start.current.x, cur.x),
      y: Math.min(start.current.y, cur.y),
      width: Math.abs(cur.x - start.current.x),
      height: Math.abs(cur.y - start.current.y),
    });
  };

  const onUp = () => {
    if (drag && drag.width > 4 && drag.height > 4) {
      setSels((prev) => [...prev, drag]);
    }
    start.current = null;
    setDrag(null);
  };

  const removeSel = (idx) => setSels((prev) => prev.filter((_, i) => i !== idx));

  async function process() {
    if (!src || sels.length === 0) return;
    setBusy(true);
    setErr(null);
    setStatus("准备中…");
    setProgress(0);
    try {
      if (method === "ai" && !window.__lamaReady) {
        const cdnBase = await getFastestCDN();
        const modelUrl = "https://xiezisheng511.github.io/picture_web/models/lama_512_int8.onnx";
        const modelBlob = await fetchWithProgress(modelUrl, setProgress);
        const blobUrl = URL.createObjectURL(modelBlob);
        if (!window.ort) {
          await loadScript(cdnBase + "ort.min.js");
        }
        window.ort.env.wasm.wasmPaths = cdnBase;
        window.__lamaModelUrl = blobUrl;
        window.__lamaReady = true;
      }
      setStatus("处理中…");
      const blob = await lib.removeWatermark(src.canvas, sels, method);
      if (result) URL.revokeObjectURL(result);
      setResult(URL.createObjectURL(blob));
      setStatus("");
    } catch (e) {
      setErr(String(e));
      setStatus("失败: " + String(e));
    } finally {
      setBusy(false);
    }
  }

  async function download() {
    if (!src || sels.length === 0) return;
    const blob = await lib.removeWatermark(src.canvas, sels, method);
    lib.downloadBlob(blob, "picedit-clean-" + Date.now() + ".png");
  }

  const getDisplayRects = () => {
    if (!imgRef.current || !src) return [];
    const r = imgRef.current.getBoundingClientRect();
    const sx = r.width / imgRef.current.naturalWidth;
    const sy = r.height / imgRef.current.naturalHeight;
    return sels.map((s, i) => ({ ...s, sx, sy, i }));
  };

  return html`<div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
    <header className="mb-6">
      <h1 className="text-3xl font-bold text-gray-900">${t("tools.removeWatermark.title")}</h1>
      <p className="text-gray-600 mt-1">${t("tools.removeWatermark.desc")}</p>
    </header>
    <${AdSlot} size="inline" className="mb-6" />
    ${!src
      ? html`<${ImageUploader} onLoad=${(img, canvas) => setSrc({ img, canvas })} />`
      : html`<div className="space-y-6">
          <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
            💡 ${t("watermark.instruction")}
            ${sels.length > 0 && html`<span className="ml-2 bg-blue-200 px-2 py-0.5 rounded-full">${sels.length} 个区域已选中</span>`}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">${t("common.before")}</p>
              <div
                className="relative inline-block cursor-crosshair select-none"
                onMouseDown=${onDown}
                onMouseMove=${onMove}
                onMouseUp=${onUp}
                onMouseLeave=${onUp}
                onDragStart=${(e) => e.preventDefault()}
              >
                <img ref=${imgRef} src=${src.img.dataUrl} alt="" draggable=${false} className="block max-w-full max-h-96 pointer-events-none" />
                ${(drag || sels.length > 0) && imgRef.current
                  ? (() => {
                      const r = imgRef.current.getBoundingClientRect();
                      const sx = r.width / imgRef.current.naturalWidth;
                      const sy = r.height / imgRef.current.naturalHeight;
                      const all = drag ? [...sels, drag] : sels;
                      return all.map((R, i) => html`<div key=${i} className="absolute border-2 ${i === all.length - 1 && drag ? 'border-blue-500 bg-blue-500/20 border-dashed' : 'border-red-500 bg-red-500/10'} pointer-events-none" style=${{ left: R.x * sx, top: R.y * sy, width: R.width * sx, height: R.height * sy }}></div>`);
                    })()
                  : null}
              </div>
              ${sels.length > 0 && html`<div className="mt-3 space-y-2">
                <p className="text-xs text-gray-500 font-medium">已选区域：</p>
                <div className="flex flex-wrap gap-2">
                  ${sels.map((s, i) => html`<div key=${i} className="bg-red-50 border border-red-200 px-3 py-1 rounded-full text-xs flex items-center gap-2">
                    <span className="text-red-600">#${i + 1}</span>
                    <span className="text-gray-600">${Math.round(s.width)}×${Math.round(s.height)}</span>
                    <button onClick=${() => removeSel(i)} className="text-red-400 hover:text-red-600 ml-1">×</button>
                  </div>`)}
                </div>
              </div>`}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">${t("common.after")}</p>
              ${result
                ? html`<${Preview} src=${result} />`
                : html`<div className="rounded-lg border border-dashed border-gray-300 h-64 flex items-center justify-center text-gray-400 text-sm">
                    ${busy
                      ? html`<div className="text-center"><div className="animate-spin text-2xl mb-2">⏳</div><span>${status}</span>${progress > 0 && html`<span> (${progress}%)</span>`}</div>`
                      : html`<span>${t("common.process")} →</span>`}
                  </div>`}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">${t("watermark.method")}</label>
              <div className="flex gap-2">
                <button onClick=${() => setMethod("blur")} className=${`px-3 py-1.5 rounded-md text-sm ${method === "blur" ? "bg-primary-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>🔲 ${t("watermark.blur")}</button>
                <button onClick=${() => setMethod("fill")} className=${`px-3 py-1.5 rounded-md text-sm ${method === "fill" ? "bg-primary-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>🎨 ${t("watermark.fill")}</button>
                <button onClick=${() => setMethod("ai")} className=${`px-3 py-1.5 rounded-md text-sm flex items-center gap-1 ${method === "ai" ? "bg-primary-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}><span>✨</span>${t("watermark.ai")}</button>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <${Button} onClick=${process} disabled=${busy || sels.length === 0}>${busy ? t("common.processing") : t("common.process")}</${Button}>
              ${result && html`<${Button} variant="secondary" onClick=${download}>⬇️ ${t("common.download")}</${Button}>`}
              <${Button} variant="ghost" onClick=${() => setSels([])}>${t("watermark.clear")}</${Button}>
              <${Button} variant="ghost" onClick=${() => { setSrc(null); setResult(null); setSels([]); }}>${t("common.reset")}</${Button}>
            </div>
            ${err && html`<p className="text-sm text-red-500">${err}</p>`}
          </div>
        </div>`}
  </div>`;
}



function Edit() {
  const { t } = useT();
  const [src, setSrc] = useState(null);
  const [working, setWorking] = useState(null);
  const [result, setResult] = useState(null);
  const [w, setW] = useState(0);
  const [h, setH] = useState(0);
  const [kr, setKr] = useState(true);
  const [fmt, setFmt] = useState('image/png');
  const [q, setQ] = useState(0.92);
  const [err, setErr] = useState(null);

  const adopt = (c) => {
    setWorking(c); setW(c.width); setH(c.height);
    if (result) URL.revokeObjectURL(result);
    setResult(c.toDataURL(fmt, q));
  };

  function onLoad(img, canvas) { setSrc({ img, canvas }); adopt(canvas); }
  function doResize() { if (src) adopt(lib.resize(src.canvas, { width: w, height: h, keepRatio: kr })); }
  function doRotate(d) { if (working) adopt(lib.rotate(working, d)); }
  function doFlip(ax) { if (working) adopt(lib.flip(working, ax)); }
  async function doExport() {
    if (!working) return;
    try { lib.downloadBlob(await lib.canvasToBlob(working, fmt, q), `picedit-${Date.now()}.${fmt === 'image/png' ? 'png' : fmt === 'image/jpeg' ? 'jpg' : 'webp'}`); }
    catch (e) { setErr(String(e)); }
  }

  return html`
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">${t('tools.edit.title')}</h1>
        <p className="text-gray-600 mt-1">${t('tools.edit.desc')}</p>
      </header>
      <${AdSlot} size="inline" className="mb-6" />
      ${!src ? html`<${ImageUploader} onLoad=${onLoad} />` : html`
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><p className="text-sm font-medium text-gray-700 mb-2">${t('common.before')}</p><${Preview} src=${src.img.dataUrl} /></div>
            <div><p className="text-sm font-medium text-gray-700 mb-2">${t('common.after')}</p>${result && html`<${Preview} src=${result} />`}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">${t('edit.resize')}</h3>
              <div className="flex items-center gap-3 flex-wrap">
                <label className="text-sm">${t('edit.width')}<input type="number" value=${w} onChange=${(e) => setW(Number(e.target.value))} className="ml-2 w-20 px-2 py-1 border border-gray-200 rounded-md text-sm" /></label>
                <label className="text-sm">${t('edit.height')}<input type="number" value=${h} onChange=${(e) => setH(Number(e.target.value))} className="ml-2 w-20 px-2 py-1 border border-gray-200 rounded-md text-sm" /></label>
                <label className="text-sm flex items-center gap-1"><input type="checkbox" checked=${kr} onChange=${(e) => setKr(e.target.checked)} />${t('edit.keepRatio')}</label>
                <${Button} onClick=${doResize}>${t('edit.resize')}<//>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">${t('edit.rotate')}</h3>
              <div className="flex gap-2 flex-wrap">
                <${Button} onClick=${() => doRotate(90)} variant="secondary" size="sm">↻ 90°<//>
                <${Button} onClick=${() => doRotate(-90)} variant="secondary" size="sm">↺ 90°<//>
                <${Button} onClick=${() => doRotate(180)} variant="secondary" size="sm">↻ 180°<//>
                <${Button} onClick=${() => doFlip('h')} variant="secondary" size="sm">${t('edit.flipH')}<//>
                <${Button} onClick=${() => doFlip('v')} variant="secondary" size="sm">${t('edit.flipV')}<//>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">${t('edit.convert')}</h3>
              <div className="flex items-center gap-3 flex-wrap">
                <label className="text-sm">${t('common.format')}
                  <select value=${fmt} onChange=${(e) => setFmt(e.target.value)} className="ml-2 px-2 py-1 border border-gray-200 rounded-md text-sm bg-white">
                    <option value="image/png">PNG</option><option value="image/jpeg">JPG</option><option value="image/webp">WebP</option>
                  </select>
                </label>
                ${(fmt === 'image/jpeg' || fmt === 'image/webp') && html`<label className="text-sm">${t('common.quality')}<input type="range" min="0.3" max="1" step="0.05" value=${q} onChange=${(e) => setQ(Number(e.target.value))} className="ml-2 align-middle" />${Math.round(q * 100)}%</label>`}
                <${Button} onClick=${doExport}>⬇️ ${t('common.download')}<//>
              </div>
            </div>
            <${Button} variant="ghost" onClick=${() => { setSrc(null); setWorking(null); setResult(null); }}>${t('common.reset')}<//>
            ${err && html`<p className="text-sm text-red-500">${err}</p>`}
          </div>
        </div>`}
    </div>`;
}

function AiCutout() {
  const { t } = useT();
  const [src, setSrc] = useState(null);
  const [cutout, setCutout] = useState(null);
  const [comp, setComp] = useState(null);
  const [bg, setBg] = useState('#ffffff');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  async function process() {
    if (!src) return;
    setBusy(true); setErr(null);
    try {
      const blob = await lib.aiCutout(src.file);
      if (cutout) URL.revokeObjectURL(cutout);
      setCutout(URL.createObjectURL(blob));
      const cb = await lib.compositeOnColor(blob, bg);
      if (comp) URL.revokeObjectURL(comp);
      setComp(URL.createObjectURL(cb));
    } catch (e) { setErr(String(e)); }
    finally { setBusy(false); }
  }
  function dl(url, name) {
    if (!url) return;
    fetch(url).then(r => r.blob()).then(b => lib.downloadBlob(b, name));
  }

  return html`
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">${t('tools.aiCutout.title')}</h1>
        <p className="text-gray-600 mt-1">${t('tools.aiCutout.desc')}</p>
      </header>
      <${AdSlot} size="inline" className="mb-6" />
      ${!src ? html`<${ImageUploader} onLoad=${(img) => setSrc(img)} />` : html`
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><p className="text-sm font-medium text-gray-700 mb-2">${t('common.before')}</p><${Preview} src=${src.dataUrl} /></div>
            <div><p className="text-sm font-medium text-gray-700 mb-2">Cutout</p>${cutout ? html`<${Preview} src=${cutout} checkerboard />` : html`<div className="rounded-lg border border-dashed border-gray-300 h-64 flex items-center justify-center text-gray-400 text-sm">${busy ? t('common.processing') : '—'}</div>`}</div>
            <div><p className="text-sm font-medium text-gray-700 mb-2">Composite</p>${comp ? html`<${Preview} src=${comp} />` : html`<div className="rounded-lg border border-dashed border-gray-300 h-64 flex items-center justify-center text-gray-400 text-sm">${busy ? t('common.processing') : '—'}</div>`}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New background</label>
              <${ColorPicker} value=${bg} onChange=${setBg} presets=${['#ffffff', '#ff0000', '#1e40af', '#10b981', '#000000']} />
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <${Button} onClick=${process} disabled=${busy}>${busy ? t('common.processing') : t('common.process')}<//>
              ${cutout && html`<${Button} variant="secondary" onClick=${() => dl(cutout, 'cutout.png')}>⬇️ PNG<//>`}
              ${comp && html`<${Button} variant="secondary" onClick=${() => dl(comp, `cutout-${Date.now()}.png`)}>⬇️ Composite<//>`}
              <${Button} variant="ghost" onClick=${() => { setSrc(null); setCutout(null); setComp(null); }}>${t('common.reset')}<//>
            </div>
            ${err && html`<p className="text-sm text-red-500">${err.message || err} — ${t('aiCutout.apiKeyMissing')}</p>`}
          </div>
        </div>`}
    </div>`;
}

function About() {
  const { t } = useT();
  const lang = useT().lang;
  return html`
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">${t('nav.about')}</h1>
      <div className="prose prose-gray space-y-4 text-gray-700">
        <p><strong>PicEdit</strong> ${lang === 'zh' ? '是一款完全免费的浏览器图片处理工具，专注于"换底色"、"去水印"、"一键抠图"等高频场景。' : 'is a free browser-based photo editor focused on background changes, watermark removal, and AI cutouts.'}</p>
        <p>${lang === 'zh' ? '与其他在线图片工具不同，PicEdit 默认情况下' : 'Unlike other online editors, PicEdit processes everything '}<strong>${lang === 'zh' ? '所有处理都在你的浏览器本地完成' : 'locally in your browser'}</strong>${lang === 'zh' ? '，你的图片文件永远不会上传到任何服务器。' : '. Your files never leave your device.'}</p>
        <h2 className="text-xl font-semibold text-gray-900 mt-8">${lang === 'zh' ? '核心特性' : 'Features'}</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>${lang === 'zh' ? '🔒 文件不上传服务器（默认所有工具）' : '🔒 Files never leave your device (default)'}</li>
          <li>${lang === 'zh' ? '⚡ 浏览器本地运算，秒级响应' : '⚡ Browser-local, sub-second results'}</li>
          <li>${lang === 'zh' ? '🆓 完全免费，无水印、无注册' : '🆓 Free forever, no signup, no watermark'}</li>
          <li>${lang === 'zh' ? '🌐 中英双语支持' : '🌐 English & Chinese UI'}</li>
          <li>${lang === 'zh' ? '🤖 可选 AI 高精度抠图（remove.bg）' : '🤖 Optional AI cutout via remove.bg'}</li>
        </ul>
      </div>
    </div>`;
}

function Privacy() {
  return html`
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy / 隐私政策</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: 2026-07-04 / 最后更新：2026-07-04</p>
      <div className="prose prose-gray space-y-6 text-gray-700">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">1. Data Processing</h2>
          <p>All image processing happens locally in your browser by default. Files are never uploaded to PicEdit or third-party servers, except when you explicitly use the "AI Cutout" feature, which sends your image to remove.bg.</p>
          <p className="mt-2"><strong>中文：</strong>PicEdit 的所有图片处理功能默认在用户浏览器本地完成。除非用户主动选择使用"AI 一键抠图"功能（其图片会上传至 remove.bg 服务），您的图片文件不会上传到 PicEdit 或任何第三方服务器。</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">2. Cookies & LocalStorage</h2>
          <p>We use localStorage only to store your language preference and (optionally) your remove.bg API key. We do not use tracking cookies.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">3. Third-Party Services</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>remove.bg</strong>: AI cutout service, used only when explicitly enabled.</li>
            <li><strong>Google AdSense</strong>: Advertising, may use cookies for personalization.</li>
            <li><strong>Google Fonts</strong>: Font delivery.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">4. Advertising</h2>
          <p>This site displays ads via Google AdSense. Google may use cookies to serve personalized ads. You can opt out via <a href="https://www.google.com/settings/ads" className="text-primary-600 underline">Google Ads Settings</a>.</p>
        </section>
      </div>
    </div>`;
}

function Terms() {
  return html`
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service / 服务条款</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: 2026-07-04 / 最后更新：2026-07-04</p>
      <div className="prose prose-gray space-y-6 text-gray-700">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">1. Service Description</h2>
          <p>PicEdit provides browser-based photo editing tools (background change, watermark removal, basic editing, AI cutout) "as is" without warranty of specific availability or result quality.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">2. User Conduct</h2>
          <p>You agree not to use this service to process infringing, illegal, or harmful content. For AI cutout, do not upload images of identifiable persons unless you have legal authorization.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">3. Intellectual Property</h2>
          <p>You retain all rights to images you upload. We claim no rights over your content. Processed results are downloaded directly to your device and are not retained on our servers.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">4. Disclaimer</h2>
          <p>The service is provided without any express or implied warranty. We are not liable for any damages arising from your use of the service.</p>
        </section>
      </div>
    </div>`;
}

// ============================================================================
// Root
// ============================================================================
function NotFound() {
  const { t } = useT();
  return html`<div className="max-w-3xl mx-auto px-4 py-12 text-center"><h1 className="text-3xl font-bold mb-4">404</h1><p>${t('common.uploadFirst')}</p></div>`;
}

function App() {
  const r = useRouter();
  let page;
  switch (r.path) {
    case '/': page = html`<${Home} />`; break;
    case '/tools/bg-color': page = html`<${BgColor} />`; break;
    case '/tools/remove-watermark': page = html`<${RemoveWatermark} />`; break;
    case '/tools/edit': page = html`<${Edit} />`; break;
    case '/tools/ai-cutout': page = html`<${AiCutout} />`; break;
    case '/about': page = html`<${About} />`; break;
    case '/privacy': page = html`<${Privacy} />`; break;
    case '/terms': page = html`<${Terms} />`; break;
    default: page = html`<${NotFound} />`;
  }
  return html`
    <${TopBanner} />
    <${Header} />
    <main className="flex-1">${page}</main>
    <${Footer} />`;
}

function Root() {
  return html`<${Router}><${I18nProvider}><${App} /><//><//>`;
}

createRoot(document.getElementById('root')).render(html`<${Root} />`);
/* PicEdit - zero-build static bundle
 * Loads React 18 from esm.sh, renders the SPA via hash routing.
 * No bundler, no npm install required. Drop this folder on any static host.
 */
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'https://esm.sh/react@18.3.1';
import { createRoot } from 'https://esm.sh/react-dom@18.3.1/client';
import htm from 'https://esm.sh/htm@3.1.1';

const html = htm.bind(React.createElement);

// ============================================================================
// i18n
// ============================================================================
const STORAGE_KEY = 'picedit.lang';
const dict = { zh: null, en: null };

async function loadDict(lang) {
  if (dict[lang]) return dict[lang];
  const res = await fetch(`/assets/i18n/${lang}.json`);
  dict[lang] = await res.json();
  return dict[lang];
}

function detectInitialLang() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'zh' || saved === 'en') return saved;
  return (navigator.language || 'en').toLowerCase().startsWith('zh') ? 'zh' : 'en';
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
    const pts = [
      [0, 0],
      [w - 1, 0],
      [0, h - 1],
      [w - 1, h - 1],
    ];
    let r = 0, g = 0, b = 0;
    for (const [x, y] of pts) {
      const d = ctx.getImageData(x, y, 1, 1).data;
      r += d[0]; g += d[1]; b += d[2];
    }
    return [Math.round(r / 4), Math.round(g / 4), Math.round(b / 4)];
  },
  async changeBackground(source, { mode, color, tolerance }) {
    const ctx = source.getContext('2d', { willReadFrequently: true });
    const { width, height } = source;
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    const ref = lib.cornerColor(ctx, width, height);
    const threshold = (tolerance / 100) * 255 * 1.732;
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
      if (Math.sqrt(dr * dr + dg * dg + db * db) > threshold) continue;
      mask[idx] = 1;
      const x = idx % width, y = (idx - x) / width;
      if (x > 0) stack.push(idx - 1);
      if (x < width - 1) stack.push(idx + 1);
      if (y > 0) stack.push(idx - width);
      if (y < height - 1) stack.push(idx + width);
    }
    const out = document.createElement('canvas');
    out.width = width;
    out.height = height;
    const octx = out.getContext('2d');
    const outData = octx.createImageData(width, height);
    const buf = outData.data;
    if (mode === 'transparent') {
      for (let i = 0; i < mask.length; i++) {
        const si = i * 4;
        if (mask[i]) buf[si + 3] = 0;
        else {
          buf[si] = data[si]; buf[si + 1] = data[si + 1];
          buf[si + 2] = data[si + 2]; buf[si + 3] = 255;
        }
      }
    } else {
      const [r, g, b] = lib.hexToRgb(color || '#ffffff');
      for (let i = 0; i < mask.length; i++) {
        const si = i * 4;
        if (mask[i]) { buf[si] = r; buf[si + 1] = g; buf[si + 2] = b; buf[si + 3] = 255; }
        else { buf[si] = data[si]; buf[si + 1] = data[si + 1]; buf[si + 2] = data[si + 2]; buf[si + 3] = 255; }
      }
    }
    octx.putImageData(outData, 0, 0);
    return await lib.canvasToBlob(out, 'image/png', 0.95);
  },
  async removeWatermark(source, regions, method = 'lama') {
    const NAS_API = 'https://rekklelama.iepose.cn';
    const ts = 512;

    async function callNas(source, regions) {
      // Create combined mask
      const { width, height } = source;
      const maskData = new ImageData(width, height);
      const mdata = maskData.data;
      for (const { x, y, width: rw, height: rh } of regions) {
        const x0 = Math.max(0, x), y0 = Math.max(0, y);
        const x1 = Math.min(width, x + rw), y1 = Math.min(height, y + rh);
        for (let yy = y0; yy < y1; yy++)
          for (let xx = x0; xx < x1; xx++) {
            const i = (yy * width + xx) * 4;
            mdata[i] = mdata[i+1] = mdata[i+2] = 255; mdata[i+3] = 255;
          }
      }
      const cnv = document.createElement('canvas');
      cnv.width = width; cnv.height = height;
      cnv.getContext('2d').putImageData(maskData, 0, 0);
      const imgB64 = cnv.toDataURL('image/png').split(',')[1];
      const mskB64 = cnv.toDataURL('image/png').split(',')[1];
      const resp = await fetch(NAS_API + '/inpaint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imgB64, mask: mskB64, target_size: ts }),
      });
      if (!resp.ok) throw new Error('NAS API ' + resp.status);
      const resultB64 = await resp.json();
      const binary = atob(resultB64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return new Blob([bytes], { type: 'image/png' });
    }

    async function localBlur(source, region) {
      const { width, height } = source;
      const ctx = source.getContext('2d', { willReadFrequently: true });
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;
      const { x, y, width: rw, height: rh } = region;
      const x0 = Math.max(0, x), y0 = Math.max(0, y);
      const x1 = Math.min(width, x + rw), y1 = Math.min(height, y + rh);
      for (let pass = 0; pass < 3; pass++) {
        const copy = new Uint8ClampedArray(data);
        for (let yy = y0 + 1; yy < y1 - 1; yy++)
          for (let xx = x0 + 1; xx < x1 - 1; xx++) {
            const i = (yy * width + xx) * 4;
            for (let c = 0; c < 3; c++) {
              let sum = 0;
              for (let dy = -1; dy <= 1; dy++)
                for (let dx = -1; dx <= 1; dx++) {
                  const ni = ((yy + dy) * width + (xx + dx)) * 4;
                  sum += copy[ni + c];
                }
              data[i + c] = Math.round(sum / 9);
            }
          }
      }
      ctx.putImageData(imgData, 0, 0);
      return await lib.canvasToBlob(source, 'image/png', 0.95);
    }

    if (method === 'lama') {
      try { return await callNas(source, regions); }
      catch {
        let canvas = source;
        for (const r of regions) {
          const blob = await localBlur(canvas, r);
          const url = URL.createObjectURL(blob);
          const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(img); i.onerror = rej; i.src = url; });
          const cnv = document.createElement('canvas');
          cnv.width = img.naturalWidth; cnv.height = img.naturalHeight;
          cnv.getContext('2d').drawImage(img, 0, 0);
          URL.revokeObjectURL(url);
          canvas = cnv;
        }
        return await lib.canvasToBlob(canvas, 'image/png', 0.95);
      }
    } else {
      let canvas = source;
      for (const r of regions) {
        const blob = await localBlur(canvas, r);
        const url = URL.createObjectURL(blob);
        const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(img); i.onerror = rej; i.src = url; });
        const cnv = document.createElement('canvas');
        cnv.width = img.naturalWidth; cnv.height = img.naturalHeight;
        cnv.getContext('2d').drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        canvas = cnv;
      }
      return await lib.canvasToBlob(canvas, 'image/png', 0.95);
    }
  },
  rotate(source, deg) {
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
  useEffect(() => {
    const t = setTimeout(() => {
      try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
    }, 100);
    return () => clearTimeout(t);
  }, []);
  const adStyle = {
    banner: { display: 'block', width: '728px', height: '90px' },
    sidebar: { display: 'block', width: '300px', height: '250px' },
    inline: { display: 'block' },
  }[size];
  const adSlotId = {
    banner: 'BANNER_SLOT_ID',
    sidebar: 'SIDEBAR_SLOT_ID',
    inline: 'INLINE_SLOT_ID',
  }[size];
  return html`
    <div className=${`w-full bg-gray-50 border border-dashed border-gray-200 rounded-md flex items-center justify-center text-xs text-gray-400 ${heights[size]}`}>
      <ins className="adsbygoogle"
           style=${adStyle}
           data-ad-client="ca-pub-9686480632598523"
           data-ad-slot=${adSlotId}
           data-ad-format="auto"
           data-full-width-responsive="true" />
    </div>`;
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
            <img src="/favicon.svg" alt="PicEdit" className="w-8 h-8" />
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
            <option value="zh">中文</option>
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
            <img src="/favicon.svg" alt="PicEdit" className="w-6 h-6" />
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
    </div>`;
}

function Preview({ src, checkerboard }) {
  return html`<div className=${`rounded-lg overflow-hidden border border-gray-200 ${checkerboard ? 'bg-checkerboard' : 'bg-gray-50'}`}>
    <img src=${src} alt="preview" className="block max-w-full max-h-96 mx-auto object-contain" />
  </div>`;
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
  const [tol, setTol] = useState(35);
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
                <div className="rounded-lg border border-dashed border-gray-300 h-64 flex items-center justify-center text-gray-400 text-sm">
                  ${busy ? t('common.processing') : t('common.process') + ' →'}
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
              ${result && html`<${Button} variant="secondary" onClick=${download}>⬇️ ${t('common.download')}<//>`}
              <${Button} variant="ghost" onClick=${() => { setSrc(null); setResult(null); }}>${t('common.reset')}<//>
            </div>
            ${err && html`<p className="text-sm text-red-500">${err}</p>`}
          </div>
        </div>`}
    </div>`;
}

function RemoveWatermark() {
  const { t } = useT();
  const [src, setSrc] = useState(null);
  const [sels, setSels] = useState([]);
  const [drag, setDrag] = useState(null);
  const [method, setMethod] = useState('lama');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const imgRef = useRef(null);
  const start = useRef(null);

  const onDown = (e) => {
    if (!imgRef.current) return;
    const r = imgRef.current.getBoundingClientRect();
    const sx = imgRef.current.naturalWidth / r.width;
    const sy = imgRef.current.naturalHeight / r.height;
    start.current = { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy };
    setDrag(null);
  };
  const onMove = (e) => {
    if (!start.current || !imgRef.current) return;
    const r = imgRef.current.getBoundingClientRect();
    const sx = imgRef.current.naturalWidth / r.width;
    const sy = imgRef.current.naturalHeight / r.height;
    const cur = { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy };
    setDrag({ x: Math.min(start.current.x, cur.x), y: Math.min(start.current.y, cur.y), width: Math.abs(cur.x - start.current.x), height: Math.abs(cur.y - start.current.y) });
  };
  const onUp = () => {
    if (drag && drag.width > 4 && drag.height > 4) {
      const exists = sels.some(r => r.x === drag.x && r.y === drag.y && r.width === drag.width && r.height === drag.height);
      if (!exists) setSels(prev => [...prev, drag]);
    }
    start.current = null; setDrag(null);
  };

  function removeRegion(idx) { setSels(prev => prev.filter((_, i) => i !== idx)); }

  async function process() {
    if (!src || sels.length === 0) return;
    setBusy(true); setErr(null);
    try {
      const blob = await lib.removeWatermark(src.canvas, sels, method);
      if (result) URL.revokeObjectURL(result);
      setResult(URL.createObjectURL(blob));
    } catch (e) { setErr(String(e)); }
    finally { setBusy(false); }
  }
  async function download() {
    if (!src || sels.length === 0) return;
    const blob = await lib.removeWatermark(src.canvas, sels, method);
    lib.downloadBlob(blob, `picedit-clean-${Date.now()}.png`);
  }

  return html`
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">${t('tools.removeWatermark.title')}</h1>
        <p className="text-gray-600 mt-1">${t('tools.removeWatermark.desc')}</p>
      </header>
      <${AdSlot} size="inline" className="mb-6" />
      ${!src ? html`<${ImageUploader} onLoad=${(img, canvas) => setSrc({ img, canvas })} />` : html\`
        <div className="space-y-6">
          <p className="text-sm text-gray-600">${t('watermark.instruction')} <span className="text-xs text-gray-400">(支持多选)</span></p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">${t('common.before')}</p>
              <div className="relative inline-block cursor-crosshair" onMouseDown=${onDown} onMouseMove=${onMove} onMouseUp=${onUp} onMouseLeave=${onUp}>
                <img ref=${imgRef} src=${src.img.dataUrl} alt="" className="block max-w-full max-h-96" />
                \${sels.map((r, i) => {
                  const r2 = imgRef.current && imgRef.current.getBoundingClientRect();
                  if (!r2) return null;
                  const sx = r2.width / imgRef.current.naturalWidth;
                  const sy = r2.height / imgRef.current.naturalHeight;
                  return html\`<div key=${i} className="absolute border-2 border-red-500 bg-red-500/10 pointer-events-none" style=${{ left: r.x * sx, top: r.y * sy, width: r.width * sx, height: r.height * sy }}></div>\`;
                })}
                \${drag && imgRef.current && (() => {
                  const r = imgRef.current.getBoundingClientRect();
                  const sx = r.width / imgRef.current.naturalWidth;
                  const sy = r.height / imgRef.current.naturalHeight;
                  return html\`<div className="absolute border-2 border-dashed border-yellow-400 bg-yellow-400/10 pointer-events-none" style=${{ left: drag.x * sx, top: drag.y * sy, width: drag.width * sx, height: drag.height * sy }}></div>\`;
                })()}
              </div>
              \${sels.length > 0 && html\`
                <div className="mt-2 flex flex-wrap gap-1">
                  \${sels.map((r, i) => html\`
                    <span key=${i} className="inline-flex items-center gap-1 text-xs bg-red-50 border border-red-200 text-red-600 px-2 py-0.5 rounded cursor-pointer hover:bg-red-100" onClick=${() => removeRegion(i)} title="点击移除">
                      #\${i+1} (\${Math.round(r.width)}x\${Math.round(r.height)}) <span className="text-red-400 font-bold">×</span>
                    </span>\`)}
                </div>\`}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">${t('common.after')}</p>
              \${result ? html\`<${Preview} src=${result} />\` : html\`
                <div className="rounded-lg border border-dashed border-gray-300 h-64 flex items-center justify-center text-gray-400 text-sm">
                  \${busy ? t('common.processing') : t('common.process') + ' →'}
                </div>\`}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">${t('watermark.method')}</label>
              <div className="flex flex-wrap gap-2">
                <button onClick=${() => setMethod('lama')} className=\${\`px-3 py-1.5 rounded-md text-sm \${method === 'lama' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}\`}>🤖 AI (LaMa)</button>
                <button onClick=${() => setMethod('blur')} className=\${\`px-3 py-1.5 rounded-md text-sm \${method === 'blur' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}\`}>\${t('watermark.blur')}</button>
                <button onClick=${() => setMethod('fill')} className=\${\`px-3 py-1.5 rounded-md text-sm \${method === 'fill' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}\`}>\${t('watermark.fill')}</button>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <${Button} onClick=${process} disabled=${busy || sels.length === 0}>\${busy ? t('common.processing') : t('common.process')}\${sels.length > 1 ? ` (\${sels.length} 区域)` : ''}</${Button}>
              \${result && html\`<${Button} variant="secondary" onClick=${download}>⬇️ \${t('common.download')}</${Button}>\`}
              <${Button} variant="ghost" onClick=${() => setSels([])} disabled=\${sels.length === 0}>${t('watermark.clear')}</${Button}>
              <${Button} variant="ghost" onClick=${() => { setSrc(null); setResult(null); setSels([]); }}>${t('common.reset')}</${Button}>
            </div>
            \${err && html\`<p className="text-sm text-red-500">\${err}</p>\`}
          </div>
        </div>\`}
    </div>\`;
}function Edit() {
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
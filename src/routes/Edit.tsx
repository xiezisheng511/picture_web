import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ImageUploader from '@/components/tool/ImageUploader';
import ImagePreview from '@/components/tool/ImagePreview';
import DownloadButton from '@/components/tool/DownloadButton';
import Button from '@/components/ui/Button';
import AdSlot from '@/components/layout/AdSlot';
import {
  resize,
  rotate,
  flip,
  downloadExport,
  fileExtension,
  type OutputFormat,
} from '@/lib/image/edit';
import type { ImageFile } from '@/types';

export default function Edit() {
  const { t } = useTranslation();
  const [source, setSource] = useState<{ img: ImageFile; canvas: HTMLCanvasElement } | null>(null);
  const [working, setWorking] = useState<HTMLCanvasElement | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [keepRatio, setKeepRatio] = useState(true);
  const [format, setFormat] = useState<OutputFormat>('image/png');
  const [quality, setQuality] = useState(0.92);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function adoptCanvas(c: HTMLCanvasElement, original: ImageFile) {
    setWorking(c);
    setWidth(c.width);
    setHeight(c.height);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(c.toDataURL(format, quality));
  }

  function onLoad(img: ImageFile, canvas: HTMLCanvasElement) {
    setSource({ img, canvas });
    adoptCanvas(canvas, img);
  }

  function doResize() {
    if (!source) return;
    const out = resize(source.canvas, { width, height, keepRatio });
    adoptCanvas(out, source.img);
  }
  function doRotate(deg: number) {
    if (!working) return;
    adoptCanvas(rotate(working, deg), source!.img);
  }
  function doFlip(axis: 'h' | 'v') {
    if (!working) return;
    adoptCanvas(flip(working, axis), source!.img);
  }
  async function doExport() {
    if (!working) return;
    setBusy(true);
    try {
      await downloadExport(working, format, quality, `picedit-${Date.now()}.${fileExtension(format)}`);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  function reset() {
    if (!source) return;
    adoptCanvas(source.canvas, source.img);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t('tools.edit.title')}</h1>
        <p className="text-gray-600 mt-1">{t('tools.edit.desc')}</p>
      </header>

      <AdSlot size="inline" className="mb-6" />

      {!source ? (
        <ImageUploader onLoad={onLoad} />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">{t('common.before')}</p>
              <ImagePreview src={source.img.dataUrl} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">{t('common.after')}</p>
              {resultUrl ? <ImagePreview src={resultUrl} /> : null}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-soft space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">{t('edit.resize')}</h3>
              <div className="flex items-center gap-3 flex-wrap">
                <label className="text-sm">
                  {t('edit.width')}
                  <input
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(Number(e.target.value))}
                    className="ml-2 w-20 px-2 py-1 border border-gray-200 rounded-md text-sm"
                  />
                </label>
                <label className="text-sm">
                  {t('edit.height')}
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    className="ml-2 w-20 px-2 py-1 border border-gray-200 rounded-md text-sm"
                  />
                </label>
                <label className="text-sm flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={keepRatio}
                    onChange={(e) => setKeepRatio(e.target.checked)}
                  />
                  {t('edit.keepRatio')}
                </label>
                <Button onClick={doResize}>{t('edit.resize')}</Button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">{t('edit.rotate')}</h3>
              <div className="flex gap-2">
                <Button onClick={() => doRotate(90)} variant="secondary" size="sm">
                  ↻ 90°
                </Button>
                <Button onClick={() => doRotate(-90)} variant="secondary" size="sm">
                  ↺ 90°
                </Button>
                <Button onClick={() => doRotate(180)} variant="secondary" size="sm">
                  ↻ 180°
                </Button>
                <Button onClick={() => doFlip('h')} variant="secondary" size="sm">
                  {t('edit.flipH')}
                </Button>
                <Button onClick={() => doFlip('v')} variant="secondary" size="sm">
                  {t('edit.flipV')}
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">{t('edit.convert')}</h3>
              <div className="flex items-center gap-3 flex-wrap">
                <label className="text-sm">
                  {t('common.format')}
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as OutputFormat)}
                    className="ml-2 px-2 py-1 border border-gray-200 rounded-md text-sm bg-white"
                  >
                    <option value="image/png">PNG</option>
                    <option value="image/jpeg">JPG</option>
                    <option value="image/webp">WebP</option>
                  </select>
                </label>
                {(format === 'image/jpeg' || format === 'image/webp') && (
                  <label className="text-sm">
                    {t('common.quality')}
                    <input
                      type="range"
                      min={0.3}
                      max={1}
                      step={0.05}
                      value={quality}
                      onChange={(e) => setQuality(Number(e.target.value))}
                      className="ml-2 align-middle"
                    />
                    {Math.round(quality * 100)}%
                  </label>
                )}
                <DownloadButton onClick={doExport} filename={`image.${fileExtension(format)}`} disabled={busy} />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button variant="ghost" onClick={reset}>
                {t('common.reset')}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setSource(null);
                  setWorking(null);
                  setResultUrl(null);
                }}
              >
                {t('common.reset')}
              </Button>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
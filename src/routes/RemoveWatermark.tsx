import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ImageUploader from '@/components/tool/ImageUploader';
import ImagePreview from '@/components/tool/ImagePreview';
import DownloadButton from '@/components/tool/DownloadButton';
import Button from '@/components/ui/Button';
import AdSlot from '@/components/layout/AdSlot';
import {
  removeWatermark,
  downloadWatermarkResult,
  type Region,
  type WatermarkMethod,
} from '@/lib/image/watermark';
import type { ImageFile } from '@/types';

export default function RemoveWatermark() {
  const { t } = useTranslation();
  const [source, setSource] = useState<{ img: ImageFile; canvas: HTMLCanvasElement } | null>(null);
  const [selection, setSelection] = useState<Region | null>(null);
  const [method, setMethod] = useState<WatermarkMethod>('blur');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const start = useRef<{ x: number; y: number } | null>(null);
  const [dragRect, setDragRect] = useState<Region | null>(null);

  function onMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const scaleX = (imgRef.current.naturalWidth || source!.img.width) / rect.width;
    const scaleY = (imgRef.current.naturalHeight || source!.img.height) / rect.height;
    start.current = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
    setDragRect(null);
  }
  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!start.current || !imgRef.current || !source) return;
    const rect = imgRef.current.getBoundingClientRect();
    const scaleX = (imgRef.current.naturalWidth || source.img.width) / rect.width;
    const scaleY = (imgRef.current.naturalHeight || source.img.height) / rect.height;
    const cur = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
    const region: Region = {
      x: Math.min(start.current.x, cur.x),
      y: Math.min(start.current.y, cur.y),
      width: Math.abs(cur.x - start.current.x),
      height: Math.abs(cur.y - start.current.y),
    };
    setDragRect(region);
  }
  function onMouseUp() {
    if (dragRect && dragRect.width > 4 && dragRect.height > 4) {
      setSelection(dragRect);
    }
    start.current = null;
  }

  async function process() {
    if (!source || !selection) return;
    setBusy(true);
    setError(null);
    try {
      const blob = await removeWatermark(source.canvas, selection, method);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(URL.createObjectURL(blob));
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function download() {
    if (!source || !selection) return;
    await downloadWatermarkResult(
      source.canvas,
      selection,
      method,
      `picedit-clean-${Date.now()}.png`
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t('tools.removeWatermark.title')}</h1>
        <p className="text-gray-600 mt-1">{t('tools.removeWatermark.desc')}</p>
      </header>

      <AdSlot size="inline" className="mb-6" />

      {!source ? (
        <ImageUploader onLoad={(img, canvas) => setSource({ img, canvas })} />
      ) : (
        <div className="space-y-6">
          <p className="text-sm text-gray-600">{t('watermark.instruction')}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">{t('common.before')}</p>
              <div
                className="relative inline-block cursor-crosshair"
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
              >
                <ImagePreview ref={imgRef} src={source.img.dataUrl} />
                {(dragRect || selection) && (() => {
                  const rect = imgRef.current?.getBoundingClientRect();
                  if (!rect) return null;
                  const r = (dragRect ?? selection)!;
                  const sx = rect.width / (imgRef.current!.naturalWidth || source.img.width);
                  const sy = rect.height / (imgRef.current!.naturalHeight || source.img.height);
                  return (
                    <div
                      className="absolute border-2 border-red-500 bg-red-500/10 pointer-events-none"
                      style={{
                        left: r.x * sx,
                        top: r.y * sy,
                        width: r.width * sx,
                        height: r.height * sy,
                      }}
                    />
                  );
                })()}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">{t('common.after')}</p>
              {resultUrl ? (
                <ImagePreview src={resultUrl} />
              ) : (
                <div className="rounded-lg border border-dashed border-gray-300 h-64 flex items-center justify-center text-gray-400 text-sm">
                  {busy ? t('common.processing') : t('common.process') + ' →'}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-soft space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('watermark.method')}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setMethod('blur')}
                  className={`px-3 py-1.5 rounded-md text-sm ${
                    method === 'blur'
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t('watermark.blur')}
                </button>
                <button
                  onClick={() => setMethod('fill')}
                  className={`px-3 py-1.5 rounded-md text-sm ${
                    method === 'fill'
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t('watermark.fill')}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={process} disabled={busy || !selection}>
                {busy ? t('common.processing') : t('common.process')}
              </Button>
              {resultUrl && (
                <DownloadButton onClick={download} filename={`clean-${Date.now()}.png`} />
              )}
              <Button variant="ghost" onClick={() => setSelection(null)}>
                {t('watermark.clear')}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setSource(null);
                  setResultUrl(null);
                  setSelection(null);
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
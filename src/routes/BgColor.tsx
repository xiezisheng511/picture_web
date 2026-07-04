import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ImageUploader from '@/components/tool/ImageUploader';
import ImagePreview from '@/components/tool/ImagePreview';
import ColorPicker from '@/components/tool/ColorPicker';
import DownloadButton from '@/components/tool/DownloadButton';
import Button from '@/components/ui/Button';
import AdSlot from '@/components/layout/AdSlot';
import { changeBackground, downloadBgResult } from '@/lib/image/bgColor';
import type { ImageFile } from '@/types';

export default function BgColor() {
  const { t } = useTranslation();
  const [source, setSource] = useState<{ img: ImageFile; canvas: HTMLCanvasElement } | null>(null);
  const [color, setColor] = useState('#ffffff');
  const [tolerance, setTolerance] = useState(35);
  const [transparent, setTransparent] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function process() {
    if (!source) return;
    setBusy(true);
    setError(null);
    try {
      const blob = await changeBackground(source.canvas, {
        mode: transparent ? 'transparent' : 'color',
        color: transparent ? undefined : color,
        tolerance,
      });
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(URL.createObjectURL(blob));
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function download() {
    if (!source || !resultUrl) return;
    await downloadBgResult(
      source.canvas,
      {
        mode: transparent ? 'transparent' : 'color',
        color: transparent ? undefined : color,
        tolerance,
      },
      `picedit-bg-${Date.now()}.png`
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t('tools.bgColor.title')}</h1>
        <p className="text-gray-600 mt-1">{t('tools.bgColor.desc')}</p>
      </header>

      <AdSlot size="inline" className="mb-6" />

      {!source ? (
        <ImageUploader onLoad={(img, canvas) => setSource({ img, canvas })} />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">{t('common.before')}</p>
              <ImagePreview src={source.img.dataUrl} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">{t('common.after')}</p>
              {resultUrl ? (
                <ImagePreview src={resultUrl} checkerboard={transparent} />
              ) : (
                <div className="rounded-lg border border-dashed border-gray-300 h-64 flex items-center justify-center text-gray-400 text-sm">
                  {busy ? t('common.processing') : t('common.process') + ' →'}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-soft space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <input
                  type="checkbox"
                  checked={transparent}
                  onChange={(e) => setTransparent(e.target.checked)}
                />
                {t('bgColor.transparent')}
              </label>
              {!transparent && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">{t('bgColor.presets')}</p>
                  <ColorPicker
                    value={color}
                    onChange={setColor}
                    presets={['#ffffff', '#ff0000', '#1e40af', '#10b981', '#000000']}
                  />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('bgColor.tolerance')}: {tolerance}
              </label>
              <input
                type="range"
                min={5}
                max={80}
                value={tolerance}
                onChange={(e) => setTolerance(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-gray-400 mt-1">{t('bgColor.edgeHint')}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={process} disabled={busy}>
                {busy ? t('common.processing') : t('common.process')}
              </Button>
              {resultUrl && (
                <DownloadButton
                  onClick={download}
                  filename={`bg-${Date.now()}.png`}
                />
              )}
              <Button variant="ghost" onClick={() => { setSource(null); setResultUrl(null); }}>
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
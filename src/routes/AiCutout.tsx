import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ImageUploader from '@/components/tool/ImageUploader';
import ImagePreview from '@/components/tool/ImagePreview';
import DownloadButton from '@/components/tool/DownloadButton';
import ColorPicker from '@/components/tool/ColorPicker';
import Button from '@/components/ui/Button';
import AdSlot from '@/components/layout/AdSlot';
import { aiCutout, compositeOnColor } from '@/lib/image/aiCutout';
import { downloadBlob } from '@/lib/image/canvas';
import type { ImageFile } from '@/types';

export default function AiCutout() {
  const { t } = useTranslation();
  const [source, setSource] = useState<ImageFile | null>(null);
  const [cutoutUrl, setCutoutUrl] = useState<string | null>(null);
  const [compositeUrl, setCompositeUrl] = useState<string | null>(null);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function process() {
    if (!source) return;
    setBusy(true);
    setError(null);
    try {
      const blob = await aiCutout(source.file);
      if (cutoutUrl) URL.revokeObjectURL(cutoutUrl);
      setCutoutUrl(URL.createObjectURL(blob));
      const comp = await compositeOnColor(blob, bgColor);
      if (compositeUrl) URL.revokeObjectURL(compositeUrl);
      setCompositeUrl(URL.createObjectURL(comp));
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  function downloadTransparent() {
    if (!cutoutUrl) return;
    fetch(cutoutUrl)
      .then((r) => r.blob())
      .then((b) => downloadBlob(b, `cutout-${Date.now()}.png`));
  }
  function downloadComposite() {
    if (!compositeUrl) return;
    fetch(compositeUrl)
      .then((r) => r.blob())
      .then((b) => downloadBlob(b, `cutout-${Date.now()}.png`));
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t('tools.aiCutout.title')}</h1>
        <p className="text-gray-600 mt-1">{t('tools.aiCutout.desc')}</p>
      </header>

      <AdSlot size="inline" className="mb-6" />

      {!source ? (
        <ImageUploader onLoad={(img) => setSource(img)} />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">{t('common.before')}</p>
              <ImagePreview src={source.dataUrl} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Cutout (PNG)</p>
              {cutoutUrl ? (
                <ImagePreview src={cutoutUrl} checkerboard />
              ) : (
                <div className="rounded-lg border border-dashed border-gray-300 h-64 flex items-center justify-center text-gray-400 text-sm">
                  {busy ? t('common.processing') : '—'}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">With new background</p>
              {compositeUrl ? (
                <ImagePreview src={compositeUrl} />
              ) : (
                <div className="rounded-lg border border-dashed border-gray-300 h-64 flex items-center justify-center text-gray-400 text-sm">
                  {busy ? t('common.processing') : '—'}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-soft space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New background color
              </label>
              <ColorPicker
                value={bgColor}
                onChange={setBgColor}
                presets={['#ffffff', '#ff0000', '#1e40af', '#10b981', '#000000']}
              />
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={process} disabled={busy}>
                {busy ? t('common.processing') : t('common.process')}
              </Button>
              {cutoutUrl && (
                <DownloadButton onClick={downloadTransparent} filename="cutout.png" />
              )}
              {compositeUrl && (
                <DownloadButton onClick={downloadComposite} filename={`cutout-${Date.now()}.png`} />
              )}
              <Button
                variant="ghost"
                onClick={() => {
                  setSource(null);
                  setCutoutUrl(null);
                  setCompositeUrl(null);
                }}
              >
                {t('common.reset')}
              </Button>
            </div>
            {error && (
              <p className="text-sm text-red-500">
                {error.message ?? String(error)} — {t('aiCutout.apiKeyMissing')}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
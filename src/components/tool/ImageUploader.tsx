import { useTranslation } from 'react-i18next';
import { useCallback, useState } from 'react';
import { loadImageToCanvas } from '@/lib/image/canvas';
import type { ImageFile } from '@/types';

interface Props {
  onLoad: (img: ImageFile, canvas: HTMLCanvasElement) => void;
}

export default function ImageUploader({ onLoad }: Props) {
  const { t } = useTranslation();
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      if (!/^image\//.test(file.type)) {
        setError(t('uploader.invalidType'));
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError(t('uploader.tooLarge'));
        return;
      }
      try {
        const { canvas, width, height } = await loadImageToCanvas(file);
        const dataUrl = canvas.toDataURL('image/png');
        onLoad({ file, dataUrl, width, height, size: file.size }, canvas);
      } catch (e) {
        setError(String(e));
      }
    },
    [onLoad, t]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
      }}
      className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors cursor-pointer ${
        dragOver ? 'border-primary-500 bg-primary-50' : 'border-gray-300 bg-white hover:border-primary-400'
      }`}
      onClick={() => document.getElementById('hidden-input')?.click()}
    >
      <input
        id="hidden-input"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <div className="text-5xl mb-3">📁</div>
      <p className="text-base text-gray-700 font-medium">{t('uploader.title')}</p>
      <p className="text-sm text-gray-500 my-2">{t('uploader.or')}</p>
      <span className="inline-block px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium">
        {t('uploader.browse')}
      </span>
      <p className="text-xs text-gray-400 mt-3">{t('uploader.hint')}</p>
      {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
    </div>
  );
}
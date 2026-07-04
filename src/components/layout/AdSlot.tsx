import { useTranslation } from 'react-i18next';

interface AdSlotProps {
  size?: 'banner' | 'sidebar' | 'inline';
  className?: string;
  label?: string;
}

/**
 * Ad slot placeholder. After AdSense approval:
 * 1. Add <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXX" />
 *    to index.html (in <head>).
 * 2. Replace the placeholder body with the <ins class="adsbygoogle" .../> snippet from AdSense.
 */
export default function AdSlot({ size = 'banner', className = '', label }: AdSlotProps) {
  const { t } = useTranslation();

  const sizeMap: Record<string, string> = {
    banner: 'min-h-[90px]',
    sidebar: 'min-h-[250px]',
    inline: 'min-h-[120px]',
  };

  return (
    <div
      className={`w-full bg-gray-50 border border-dashed border-gray-200 rounded-md flex items-center justify-center text-xs text-gray-400 ${sizeMap[size]} ${className}`}
      aria-label={label ?? t('ad.placeholder')}
      data-ad-slot={size}
    >
      <div className="text-center px-4">
        <div className="uppercase tracking-wider mb-1">{t('home.adNote')}</div>
        <div className="text-gray-300">{t('ad.placeholder')}</div>
      </div>
    </div>
  );
}
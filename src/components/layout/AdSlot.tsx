import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

interface AdSlotProps {
  size?: 'banner' | 'sidebar' | 'inline';
  className?: string;
  label?: string;
}

/**
 * Ad slot component with Google AdSense integration.
 */
export default function AdSlot({ size = 'banner', className = '', label }: AdSlotProps) {
  const { t } = useTranslation();

  const sizeMap: Record<string, string> = {
    banner: 'min-h-[90px]',
    sidebar: 'min-h-[250px]',
    inline: 'min-h-[120px]',
  };

  const adStyleMap: Record<string, React.CSSProperties> = {
    banner: { display: 'block', width: '728px', height: '90px' },
    sidebar: { display: 'block', width: '300px', height: '250px' },
    inline: { display: 'block' },
  };

  const adSlotMap: Record<string, string> = {
    banner: 'BANNER_SLOT_ID',
    sidebar: 'SIDEBAR_SLOT_ID',
    inline: 'INLINE_SLOT_ID',
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.warn('AdSense not loaded:', e);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`w-full bg-gray-50 border border-dashed border-gray-200 rounded-md flex items-center justify-center text-xs text-gray-400 ${sizeMap[size]} ${className}`}
      aria-label={label ?? t('ad.placeholder')}
      data-ad-slot={size}
    >
      <ins
        className="adsbygoogle"
        style={adStyleMap[size]}
        data-ad-client="ca-pub-9686480632598523"
        data-ad-slot={adSlotMap[size]}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
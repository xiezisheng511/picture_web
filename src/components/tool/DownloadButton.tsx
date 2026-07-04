import { useTranslation } from 'react-i18next';

interface Props {
  disabled?: boolean;
  onClick: () => void;
  filename?: string;
}

export default function DownloadButton({ disabled, onClick, filename = 'image.png' }: Props) {
  const { t } = useTranslation();
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center gap-2 px-4 py-2 bg-accent-500 text-white rounded-lg text-sm font-medium hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      <span>⬇️</span>
      {t('common.download')} {filename}
    </button>
  );
}